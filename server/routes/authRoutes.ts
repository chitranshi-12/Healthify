import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, queryOne, saveDb } from '../config/db.js';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password validation: at least 8 chars, at least one letter, at least one digit
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Please provide a valid full name (at least 2 characters).' });
      return;
    }

    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!PASSWORD_REGEX.test(password || '')) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and numbers.',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }

    const db = await getDb();

    // Check if email already registered
    const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    db.run(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [trimmedEmail, passwordHash, fullName.trim()]
    );

    const user = queryOne<{ id: number; email: string; full_name: string }>(
      db,
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (!user) {
      res.status(500).json({ success: false, message: 'Failed to create user account.' });
      return;
    }

    // Initialize blank profile for new user
    db.run(
      'INSERT INTO profiles (user_id, onboarding_completed, daily_water_glasses, water_updated_date) VALUES (?, 0, 0, date("now"))',
      [user.id]
    );

    saveDb();

    const token = generateToken(user, false);

    // Set HTTP-only cookie as well for resilience
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          onboardingCompleted: false,
        },
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while creating account.' });
  }
});

router.post('/login', loginRateLimiter(), async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !password) {
      res.status(400).json({ success: false, message: 'Please enter both email and password.' });
      return;
    }

    const db = await getDb();
    const user = queryOne<{ id: number; email: string; password_hash: string; full_name: string }>(
      db,
      'SELECT id, email, password_hash, full_name FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });
      return;
    }

    const passwordMatches = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });
      return;
    }

    // Check profile onboarding status
    const profile = queryOne<{ onboarding_completed: number }>(
      db,
      'SELECT onboarding_completed FROM profiles WHERE user_id = ?',
      [user.id]
    );

    const token = generateToken(user, !!rememberMe);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          onboardingCompleted: profile ? profile.onboarding_completed === 1 : false,
        },
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred during login.' });
  }
});

// Google Authentication Endpoint
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, fullName, googleId, credential } = req.body;

    let targetEmail = (email || '').trim().toLowerCase();
    let targetName = (fullName || '').trim();

    // If a JWT credential token was passed from Google Identity Services, decode it
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            targetEmail = payload.email.trim().toLowerCase();
          }
          if (payload.name) {
            targetName = payload.name.trim();
          }
        }
      } catch (decodeErr) {
        console.warn('Could not decode Google credential JWT payload:', decodeErr);
      }
    }

    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      res.status(400).json({ success: false, message: 'Valid Google email address is required.' });
      return;
    }

    if (!targetName) {
      targetName = targetEmail.split('@')[0];
    }

    const db = await getDb();
    let user = queryOne<{ id: number; email: string; full_name: string }>(
      db,
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [targetEmail]
    );

    let isNewUser = false;

    if (!user) {
      // User doesn't exist yet, auto-register them
      isNewUser = true;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(randomPassword, salt);

      db.run(
        'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
        [targetEmail, passwordHash, targetName]
      );

      user = queryOne<{ id: number; email: string; full_name: string }>(
        db,
        'SELECT id, email, full_name FROM users WHERE email = ?',
        [targetEmail]
      );

      if (!user) {
        res.status(500).json({ success: false, message: 'Failed to create user with Google.' });
        return;
      }

      // Initialize profile
      db.run(
        'INSERT INTO profiles (user_id, onboarding_completed, daily_water_glasses, water_updated_date) VALUES (?, 0, 0, date("now"))',
        [user.id]
      );

      saveDb();
    }

    const profile = queryOne<{ onboarding_completed: number }>(
      db,
      'SELECT onboarding_completed FROM profiles WHERE user_id = ?',
      [user.id]
    );

    const token = generateToken(user, true);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: isNewUser ? 'Welcome to Healthify via Google!' : 'Welcome back with Google!',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          onboardingCompleted: profile ? profile.onboarding_completed === 1 : false,
        },
      },
    });
  } catch (err: any) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, message: 'Google Authentication failed.' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = queryOne<{ id: number; email: string; full_name: string }>(
      db,
      'SELECT id, email, full_name FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [user.id]);
    const conditionsRes = queryOne<{ conditions_str: string }>(
      db,
      'SELECT GROUP_CONCAT(condition_name, ",") as conditions_str FROM conditions WHERE user_id = ?',
      [user.id]
    );

    const conditions = conditionsRes?.conditions_str ? conditionsRes.conditions_str.split(',') : [];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          onboardingCompleted: profile ? profile.onboarding_completed === 1 : false,
        },
        profile,
        conditions,
      },
    });
  } catch (err: any) {
    console.error('Me error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail) {
      res.status(400).json({ success: false, message: 'Please enter your account email.' });
      return;
    }

    const db = await getDb();
    const user = queryOne<{ id: number; email: string }>(
      db,
      'SELECT id, email FROM users WHERE email = ?',
      [trimmedEmail]
    );

    // Don't reveal whether user exists for security, but generate token if exists
    let resetToken = '';
    if (user) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      db.run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [
        resetToken,
        expires,
        user.id,
      ]);
      saveDb();

      console.log('\n========================================');
      console.log('🔑 PASSWORD RESET LINK:');
      console.log(`http://localhost:3000/reset-password?token=${resetToken}`);
      console.log('========================================\n');
    }

    res.json({
      success: true,
      message: 'If that email is registered, a password reset link has been generated.',
      // Return dev token in response to allow frictionless testing in AI Studio preview
      data: resetToken ? { devResetToken: resetToken } : null,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Error processing password reset request.' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and numbers.',
      });
      return;
    }

    const db = await getDb();
    const user = queryOne<{ id: number; reset_expires: string }>(
      db,
      'SELECT id, reset_expires FROM users WHERE reset_token = ?',
      [token]
    );

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
      return;
    }

    const expiresAt = new Date(user.reset_expires).getTime();
    if (Date.now() > expiresAt) {
      res.status(400).json({ success: false, message: 'Password reset link has expired. Please request a new one.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [newHash, user.id]
    );
    saveDb();

    res.json({ success: true, message: 'Password has been successfully reset! You can now log in.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

router.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain both letters and numbers.',
      });
      return;
    }

    const db = await getDb();
    const user = queryOne<{ id: number; password_hash: string }>(
      db,
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    saveDb();

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

router.patch('/profile-name', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fullName } = req.body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
      return;
    }

    const db = await getDb();
    db.run('UPDATE users SET full_name = ? WHERE id = ?', [fullName.trim(), req.user!.id]);
    saveDb();

    res.json({ success: true, message: 'Name updated successfully', data: { fullName: fullName.trim() } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update name.' });
  }
});

router.delete('/delete-account', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    // Cascading deletes in SQLite
    db.run('DELETE FROM intake_logs WHERE user_id = ?', [userId]);
    db.run('DELETE FROM care_checklists WHERE user_id = ?', [userId]);
    db.run('DELETE FROM medicines WHERE user_id = ?', [userId]);
    db.run('DELETE FROM conditions WHERE user_id = ?', [userId]);
    db.run('DELETE FROM vitals WHERE user_id = ?', [userId]);
    db.run('DELETE FROM diet_plans WHERE user_id = ?', [userId]);
    db.run('DELETE FROM workout_logs WHERE user_id = ?', [userId]);
    db.run('DELETE FROM exercise_plans WHERE user_id = ?', [userId]);
    db.run('DELETE FROM profiles WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId]);

    saveDb();
    res.clearCookie('token');
    res.json({ success: true, message: 'Account and all associated health data have been completely deleted.' });
  } catch (err: any) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
});

export default router;
