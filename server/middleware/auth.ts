import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, queryOne } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'healthify-super-secret-jwt-key-2026';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      // Check cookies for token
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, val] = cookie.trim().split('=');
        if (name === 'token') {
          token = decodeURIComponent(val);
          break;
        }
      }
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    const db = await getDb();
    const user = queryOne<{ id: number; email: string; full_name: string }>(
      db,
      'SELECT id, email, full_name FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found or deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

export function generateToken(user: { id: number; email: string }, rememberMe = false): string {
  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn });
}
