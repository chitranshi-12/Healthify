import { Router, Response } from 'express';
import { getDb, queryAll, queryOne, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { HEALTH_CONDITIONS_KB } from '../data/healthConditionsKnowledge.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    const rows = queryAll<{ id: number; condition_name: string; notes: string; created_at: string }>(
      db,
      'SELECT id, condition_name, notes, created_at FROM conditions WHERE user_id = ?',
      [userId]
    );

    const conditionsWithKB = rows.map(r => ({
      ...r,
      kb: HEALTH_CONDITIONS_KB[r.condition_name] || null,
    }));

    res.json({ success: true, data: conditionsWithKB });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch conditions' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conditionName, notes } = req.body;

    if (!conditionName || typeof conditionName !== 'string') {
      res.status(400).json({ success: false, message: 'Condition name is required' });
      return;
    }

    const normalized = conditionName.toLowerCase().trim();
    const db = await getDb();

    // Check duplicate
    const existing = queryOne(db, 'SELECT id FROM conditions WHERE user_id = ? AND condition_name = ?', [
      userId,
      normalized,
    ]);
    if (existing) {
      res.status(400).json({ success: false, message: 'Condition is already in your profile' });
      return;
    }

    db.run('INSERT INTO conditions (user_id, condition_name, notes) VALUES (?, ?, ?)', [
      userId,
      normalized,
      notes || '',
    ]);

    // Add care checklist items
    const kb = HEALTH_CONDITIONS_KB[normalized];
    if (kb && kb.careChecklist) {
      for (const item of kb.careChecklist) {
        db.run(`
          INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
          VALUES (?, ?, ?, ?, ?, 1)
        `, [userId, normalized, item.title, item.defaultTime, item.frequency]);
      }
    }

    saveDb();
    res.status(201).json({ success: true, message: 'Condition added successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to add condition' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const conditionId = Number(req.params.id);

    const db = await getDb();
    const cond = queryOne<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE id = ? AND user_id = ?',
      [conditionId, userId]
    );

    if (!cond) {
      res.status(404).json({ success: false, message: 'Condition not found' });
      return;
    }

    db.run('DELETE FROM conditions WHERE id = ? AND user_id = ?', [conditionId, userId]);
    // Also remove care checklist items associated with this condition
    db.run('DELETE FROM care_checklists WHERE user_id = ? AND condition_name = ?', [userId, cond.condition_name]);

    saveDb();
    res.json({ success: true, message: 'Condition removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete condition' });
  }
});

export default router;
