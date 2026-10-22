import { Router, Response } from 'express';
import { getDb, queryAll, queryOne, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Evaluate clinical status flag for vital signs
function evaluateVitalStatus(type: string, val1: number, val2?: number | null, timing?: string): { flag: string; message: string; isEmergency?: boolean } {
  if (type === 'blood_pressure') {
    const sys = val1;
    const dia = val2 || 80;
    if (sys >= 180 || dia >= 120) {
      return { flag: 'critical', message: 'Hypertensive crisis range! Seek medical attention immediately.', isEmergency: true };
    }
    if (sys >= 140 || dia >= 90) {
      return { flag: 'high', message: 'Stage 2 Hypertension range.' };
    }
    if (sys >= 130 || dia >= 80) {
      return { flag: 'elevated', message: 'Stage 1 Hypertension / elevated blood pressure.' };
    }
    if (sys >= 120 && dia < 80) {
      return { flag: 'elevated', message: 'Elevated systolic pressure.' };
    }
    if (sys < 90 || dia < 60) {
      return { flag: 'low', message: 'Low blood pressure (hypotension).' };
    }
    return { flag: 'normal', message: 'Optimal healthy blood pressure.' };
  }

  if (type === 'blood_sugar') {
    const glucose = val1;
    if (glucose < 54) {
      return { flag: 'critical', message: 'Severe hypoglycemia! Consume fast-acting sugar immediately.', isEmergency: true };
    }
    if (glucose < 70) {
      return { flag: 'low', message: 'Low blood sugar. Have 15g fast carbohydrate.' };
    }
    if (glucose >= 250) {
      return { flag: 'critical', message: 'Significantly elevated glucose. Follow doctor management protocol.', isEmergency: true };
    }
    if (glucose >= 180) {
      return { flag: 'high', message: 'High blood sugar.' };
    }
    if (glucose >= 126 && (!timing || timing.includes('fasting'))) {
      return { flag: 'elevated', message: 'Fasting glucose in elevated diabetic range.' };
    }
    return { flag: 'normal', message: 'Blood sugar within target range.' };
  }

  if (type === 'heart_rate') {
    const hr = val1;
    if (hr < 45 || hr > 150) {
      return { flag: 'critical', message: 'Irregular pulse alert. If feeling unwell, consult a doctor.', isEmergency: true };
    }
    if (hr < 60) {
      return { flag: 'low', message: 'Resting bradycardia (common in athletes or medication-induced).' };
    }
    if (hr > 100) {
      return { flag: 'elevated', message: 'Tachycardia / elevated resting pulse.' };
    }
    return { flag: 'normal', message: 'Normal resting heart rate.' };
  }

  return { flag: 'normal', message: 'Recorded' };
}

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type } = req.query;

    const db = await getDb();
    let query = 'SELECT * FROM vitals WHERE user_id = ?';
    const params: any[] = [userId];

    if (type && typeof type === 'string') {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY recorded_at DESC LIMIT 100';

    const vitals = queryAll(db, query, params);

    // Group latest values by type for summary cards
    const latestByType: Record<string, any> = {};
    for (const v of vitals) {
      if (!latestByType[v.type]) {
        latestByType[v.type] = v;
      }
    }

    res.json({
      success: true,
      data: {
        records: vitals,
        latest: latestByType,
      },
    });
  } catch (err: any) {
    console.error('Get vitals error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve vitals' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      type, // 'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate'
      value_primary,
      value_secondary,
      unit,
      notes,
      timing, // e.g. 'Fasting', '2h Post Meal', 'Resting'
    } = req.body;

    if (!type || value_primary === undefined) {
      res.status(400).json({ success: false, message: 'Type and primary value are required' });
      return;
    }

    const val1 = Number(value_primary);
    const val2 = value_secondary !== undefined && value_secondary !== null ? Number(value_secondary) : null;

    const evaluation = evaluateVitalStatus(type, val1, val2, notes || timing);

    const fullNotes = notes || (timing ? `${timing}` : '');

    const db = await getDb();
    db.run(`
      INSERT INTO vitals (
        user_id, type, value_primary, value_secondary, unit, notes, status_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      type,
      val1,
      val2,
      unit || (type === 'blood_pressure' ? 'mmHg' : type === 'blood_sugar' ? 'mg/dL' : type === 'weight' ? 'kg' : 'bpm'),
      fullNotes,
      evaluation.flag,
    ]);

    // If type is weight, also sync to profile
    if (type === 'weight') {
      db.run('UPDATE profiles SET weight_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [val1, userId]);
    }

    saveDb();

    res.status(201).json({
      success: true,
      message: 'Vital log recorded successfully!',
      data: {
        evaluation,
      },
    });
  } catch (err: any) {
    console.error('Add vital error:', err);
    res.status(500).json({ success: false, message: 'Failed to record vital sign' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const vitalId = Number(req.params.id);

    const db = await getDb();
    db.run('DELETE FROM vitals WHERE id = ? AND user_id = ?', [vitalId, userId]);
    saveDb();

    res.json({ success: true, message: 'Vital entry removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete vital' });
  }
});

export default router;
