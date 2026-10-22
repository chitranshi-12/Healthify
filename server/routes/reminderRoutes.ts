import { Router, Response } from 'express';
import { getDb, queryAll, queryOne, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/today', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];

    // Fetch user medicines
    const medicines = queryAll(
      db,
      'SELECT * FROM medicines WHERE user_id = ?',
      [userId]
    );

    // Fetch care checklists
    const checklists = queryAll(
      db,
      'SELECT * FROM care_checklists WHERE user_id = ? AND is_enabled = 1',
      [userId]
    );

    // Fetch existing intake logs for today
    const intakeLogs = queryAll(
      db,
      'SELECT * FROM intake_logs WHERE user_id = ? AND scheduled_date = ?',
      [userId, todayStr]
    );

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const scheduleItems: Array<{
      id: string;
      medicine_id?: number;
      care_checklist_id?: number;
      type: 'medicine' | 'care_checklist';
      title: string;
      dose?: string;
      form?: string;
      meal_timing?: string;
      scheduled_time: string;
      status: 'pending' | 'taken' | 'skipped' | 'snoozed';
      is_overdue: boolean;
      intake_log_id?: number;
      taken_at?: string;
      stock_quantity?: number;
      notes?: string;
    }> = [];

    // Process medicines
    for (const med of medicines) {
      // Check start and end date
      if (med.start_date && todayStr < med.start_date) continue;
      if (med.end_date && todayStr > med.end_date) continue;

      // Check days of week
      let days: string[] | string = 'everyday';
      try {
        if (med.days_of_week && med.days_of_week.startsWith('[')) {
          days = JSON.parse(med.days_of_week);
        } else {
          days = med.days_of_week || 'everyday';
        }
      } catch {
        days = 'everyday';
      }

      if (Array.isArray(days) && !days.includes(dayOfWeek) && !days.includes('everyday')) {
        continue;
      }

      let times: string[] = [];
      try {
        times = JSON.parse(med.times_of_day);
      } catch {
        times = [med.times_of_day || '08:00'];
      }

      for (const t of times) {
        const [h, m] = t.split(':').map(Number);
        const itemMinutes = h * 60 + m;

        // Check if logged today
        const log = intakeLogs.find(
          l => l.medicine_id === med.id && l.scheduled_time === t
        );

        const status = (log?.status as any) || 'pending';
        const isOverdue = status === 'pending' && currentMinutes > itemMinutes + 15; // 15 mins grace period

        scheduleItems.push({
          id: `med-${med.id}-${t}`,
          medicine_id: med.id,
          type: 'medicine',
          title: med.name,
          dose: med.dose,
          form: med.form,
          meal_timing: med.meal_timing,
          scheduled_time: t,
          status,
          is_overdue: isOverdue,
          intake_log_id: log?.id,
          taken_at: log?.taken_at,
          stock_quantity: med.stock_quantity,
          notes: med.notes,
        });
      }
    }

    // Process care checklists
    for (const chk of checklists) {
      const t = chk.scheduled_time || '08:00';
      const [h, m] = t.split(':').map(Number);
      const itemMinutes = h * 60 + m;

      const log = intakeLogs.find(
        l => l.care_checklist_id === chk.id && l.scheduled_time === t
      );

      const status = (log?.status as any) || 'pending';
      const isOverdue = status === 'pending' && currentMinutes > itemMinutes + 30;

      scheduleItems.push({
        id: `chk-${chk.id}-${t}`,
        care_checklist_id: chk.id,
        type: 'care_checklist',
        title: chk.title,
        scheduled_time: t,
        status,
        is_overdue: isOverdue,
        intake_log_id: log?.id,
        taken_at: log?.taken_at,
      });
    }

    // Sort chronologically by scheduled_time
    scheduleItems.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

    // Calculate next upcoming dose
    const nextUpcoming = scheduleItems.find(item => {
      const [h, m] = item.scheduled_time.split(':').map(Number);
      return h * 60 + m >= currentMinutes && item.status === 'pending';
    }) || scheduleItems.find(item => item.status === 'pending');

    const totalCount = scheduleItems.length;
    const takenCount = scheduleItems.filter(i => i.status === 'taken').length;
    const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

    res.json({
      success: true,
      data: {
        date: todayStr,
        schedule: scheduleItems,
        nextUpcoming: nextUpcoming || null,
        stats: {
          total: totalCount,
          taken: takenCount,
          percentage,
          allCompleted: totalCount > 0 && takenCount === totalCount,
        },
      },
    });
  } catch (err: any) {
    console.error('Get today reminders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch today schedule' });
  }
});

router.post('/log', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      medicine_id,
      care_checklist_id,
      item_name,
      scheduled_time,
      status, // 'taken' | 'skipped' | 'snoozed'
      notes,
    } = req.body;

    if (!scheduled_time || !status) {
      res.status(400).json({ success: false, message: 'scheduled_time and status are required' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const db = await getDb();

    // Check existing log
    let existingLog: any = null;
    if (medicine_id) {
      existingLog = queryOne(
        db,
        'SELECT id, status FROM intake_logs WHERE user_id = ? AND medicine_id = ? AND scheduled_time = ? AND scheduled_date = ?',
        [userId, medicine_id, scheduled_time, todayStr]
      );
    } else if (care_checklist_id) {
      existingLog = queryOne(
        db,
        'SELECT id, status FROM intake_logs WHERE user_id = ? AND care_checklist_id = ? AND scheduled_time = ? AND scheduled_date = ?',
        [userId, care_checklist_id, scheduled_time, todayStr]
      );
    }

    const takenAt = status === 'taken' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;

    if (existingLog) {
      // If previous status was not taken, but now taken, decrement stock
      if (existingLog.status !== 'taken' && status === 'taken' && medicine_id) {
        db.run('UPDATE medicines SET stock_quantity = MAX(0, stock_quantity - 1) WHERE id = ?', [medicine_id]);
      } else if (existingLog.status === 'taken' && status !== 'taken' && medicine_id) {
        // Revert stock if untaken
        db.run('UPDATE medicines SET stock_quantity = stock_quantity + 1 WHERE id = ?', [medicine_id]);
      }

      db.run(`
        UPDATE intake_logs SET status = ?, taken_at = ?, notes = ?
        WHERE id = ?
      `, [status, takenAt, notes || null, existingLog.id]);
    } else {
      db.run(`
        INSERT INTO intake_logs (
          user_id, medicine_id, care_checklist_id, item_name,
          scheduled_time, scheduled_date, status, taken_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        medicine_id || null,
        care_checklist_id || null,
        item_name || 'Item',
        scheduled_time,
        todayStr,
        status,
        takenAt,
        notes || null,
      ]);

      if (status === 'taken' && medicine_id) {
        db.run('UPDATE medicines SET stock_quantity = MAX(0, stock_quantity - 1) WHERE id = ?', [medicine_id]);
      }
    }

    saveDb();

    // Return updated medicine stock if medicine
    let updatedStock: number | null = null;
    if (medicine_id) {
      const med = queryOne<{ stock_quantity: number }>(db, 'SELECT stock_quantity FROM medicines WHERE id = ?', [medicine_id]);
      updatedStock = med ? med.stock_quantity : null;
    }

    res.json({
      success: true,
      message: status === 'taken' ? 'Marked as taken! Good job!' : `Marked as ${status}`,
      data: { status, updatedStock },
    });
  } catch (err: any) {
    console.error('Log reminder error:', err);
    res.status(500).json({ success: false, message: 'Failed to record reminder log' });
  }
});

router.get('/adherence', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    // Calculate last 7 days adherence
    const days: Array<{ date: string; dayName: string; taken: number; total: number; percentage: number }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];

      const logs = queryAll(
        db,
        'SELECT status FROM intake_logs WHERE user_id = ? AND scheduled_date = ?',
        [userId, dateStr]
      );

      const total = logs.length;
      const taken = logs.filter(l => l.status === 'taken').length;
      const percentage = total > 0 ? Math.round((taken / total) * 100) : (i === 0 ? 100 : 0);

      days.push({
        date: dateStr,
        dayName,
        taken,
        total,
        percentage,
      });
    }

    // Calculate streak: count consecutive days backwards from today with >= 80% or taken items
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const logs = queryAll(
        db,
        'SELECT status FROM intake_logs WHERE user_id = ? AND scheduled_date = ?',
        [userId, dateStr]
      );
      if (logs.length > 0) {
        const taken = logs.filter(l => l.status === 'taken').length;
        if (taken > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      } else if (i > 0) {
        break;
      }
    }

    // Missed dose history (last 14 days)
    const missedLogs = queryAll(
      db,
      `SELECT item_name, scheduled_date, scheduled_time, notes
       FROM intake_logs
       WHERE user_id = ? AND status = 'skipped'
       ORDER BY scheduled_date DESC, scheduled_time DESC
       LIMIT 10`,
      [userId]
    );

    // Low stock alerts
    const lowStockMeds = queryAll(
      db,
      'SELECT id, name, dose, stock_quantity FROM medicines WHERE user_id = ? AND stock_quantity <= 5',
      [userId]
    );

    // Overall weekly percentage
    const totalWeeklyScheduled = days.reduce((acc, d) => acc + d.total, 0);
    const totalWeeklyTaken = days.reduce((acc, d) => acc + d.taken, 0);
    const weeklyAdherence = totalWeeklyScheduled > 0
      ? Math.round((totalWeeklyTaken / totalWeeklyScheduled) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        weeklyAdherence,
        streak,
        dailyBreakdown: days,
        missedDoses: missedLogs,
        lowStockMedicines: lowStockMeds,
      },
    });
  } catch (err: any) {
    console.error('Adherence stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate adherence' });
  }
});

router.post('/care-checklists', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, scheduled_time, condition_name } = req.body;

    if (!title || !scheduled_time) {
      res.status(400).json({ success: false, message: 'Title and scheduled time are required' });
      return;
    }

    const db = await getDb();
    db.run(`
      INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
      VALUES (?, ?, ?, ?, 'daily', 1)
    `, [userId, condition_name || 'custom', title.trim(), scheduled_time]);

    saveDb();
    res.status(201).json({ success: true, message: 'Care checklist reminder added!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to add care checklist' });
  }
});

router.delete('/care-checklists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const chkId = Number(req.params.id);

    const db = await getDb();
    db.run('DELETE FROM care_checklists WHERE id = ? AND user_id = ?', [chkId, userId]);
    saveDb();
    res.json({ success: true, message: 'Care checklist item removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to remove care checklist item' });
  }
});

export default router;
