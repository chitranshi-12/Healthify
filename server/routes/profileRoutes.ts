import { Router, Response } from 'express';
import { getDb, queryOne, queryAll, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { HEALTH_CONDITIONS_KB } from '../data/healthConditionsKnowledge.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const conditions = queryAll<{ id: number; condition_name: string; notes: string }>(
      db,
      'SELECT id, condition_name, notes FROM conditions WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        profile,
        conditions: conditions.map(c => c.condition_name),
        conditionDetails: conditions,
      },
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

router.post('/onboarding', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      age,
      gender,
      height_cm,
      weight_kg,
      activity_level,
      food_preference,
      cuisine,
      food_allergies,
      goal,
      conditions, // array of strings
    } = req.body;

    const db = await getDb();

    // Upsert profile
    const existing = queryOne(db, 'SELECT id FROM profiles WHERE user_id = ?', [userId]);
    if (existing) {
      db.run(`
        UPDATE profiles SET
          age = ?, gender = ?, height_cm = ?, weight_kg = ?, activity_level = ?,
          food_preference = ?, cuisine = ?, food_allergies = ?, goal = ?,
          onboarding_completed = 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        age || null,
        gender || null,
        height_cm || null,
        weight_kg || null,
        activity_level || 'moderate',
        food_preference || 'vegetarian',
        cuisine || 'Healthy Global',
        food_allergies || 'None',
        goal || 'manage condition',
        userId,
      ]);
    } else {
      db.run(`
        INSERT INTO profiles (
          user_id, age, gender, height_cm, weight_kg, activity_level,
          food_preference, cuisine, food_allergies, goal, onboarding_completed, daily_water_glasses, water_updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, date('now'))
      `, [
        userId,
        age || null,
        gender || null,
        height_cm || null,
        weight_kg || null,
        activity_level || 'moderate',
        food_preference || 'vegetarian',
        cuisine || 'Healthy Global',
        food_allergies || 'None',
        goal || 'manage condition',
      ]);
    }

    // Replace conditions
    db.run('DELETE FROM conditions WHERE user_id = ?', [userId]);
    db.run('DELETE FROM care_checklists WHERE user_id = ?', [userId]);

    const conditionsList: string[] = Array.isArray(conditions) ? conditions : [];
    for (const cond of conditionsList) {
      const normalizedCond = cond.toLowerCase().trim();
      db.run('INSERT INTO conditions (user_id, condition_name) VALUES (?, ?)', [userId, normalizedCond]);

      // Add condition care checklist items automatically!
      const kb = HEALTH_CONDITIONS_KB[normalizedCond];
      if (kb && kb.careChecklist) {
        for (const item of kb.careChecklist) {
          db.run(`
            INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
            VALUES (?, ?, ?, ?, ?, 1)
          `, [userId, normalizedCond, item.title, item.defaultTime, item.frequency]);
        }
      }
    }

    // Also record initial weight vital if weight_kg is provided
    if (weight_kg && Number(weight_kg) > 0) {
      db.run(`
        INSERT INTO vitals (user_id, type, value_primary, unit, notes, status_flag)
        VALUES (?, 'weight', ?, 'kg', 'Initial onboarding weight', 'normal')
      `, [userId, Number(weight_kg)]);
    }

    saveDb();

    res.json({
      success: true,
      message: 'Onboarding completed successfully!',
      data: { onboardingCompleted: true },
    });
  } catch (err: any) {
    console.error('Onboarding error:', err);
    res.status(500).json({ success: false, message: 'Failed to save onboarding data' });
  }
});

router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      age,
      gender,
      height_cm,
      weight_kg,
      activity_level,
      food_preference,
      cuisine,
      food_allergies,
      goal,
      conditions,
    } = req.body;

    const db = await getDb();

    db.run(`
      UPDATE profiles SET
        age = ?, gender = ?, height_cm = ?, weight_kg = ?, activity_level = ?,
        food_preference = ?, cuisine = ?, food_allergies = ?, goal = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      age || null,
      gender || null,
      height_cm || null,
      weight_kg || null,
      activity_level || 'moderate',
      food_preference || 'vegetarian',
      cuisine || 'Balanced',
      food_allergies || 'None',
      goal || 'stay fit',
      userId,
    ]);

    if (Array.isArray(conditions)) {
      db.run('DELETE FROM conditions WHERE user_id = ?', [userId]);
      for (const cond of conditions) {
        const normalized = cond.toLowerCase().trim();
        db.run('INSERT INTO conditions (user_id, condition_name) VALUES (?, ?)', [userId, normalized]);

        // Add checklists if not existing
        const kb = HEALTH_CONDITIONS_KB[normalized];
        if (kb && kb.careChecklist) {
          for (const item of kb.careChecklist) {
            const exists = queryOne(db, 'SELECT id FROM care_checklists WHERE user_id = ? AND title = ?', [userId, item.title]);
            if (!exists) {
              db.run(`
                INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
                VALUES (?, ?, ?, ?, ?, 1)
              `, [userId, normalized, item.title, item.defaultTime, item.frequency]);
            }
          }
        }
      }
    }

    saveDb();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
