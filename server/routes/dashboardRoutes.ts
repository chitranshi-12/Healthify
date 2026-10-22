import { Router, Response } from 'express';
import { getDb, queryOne, queryAll, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { HEALTH_CONDITIONS_KB } from '../data/healthConditionsKnowledge.js';

const router = Router();

const HEALTH_TIPS = [
  {
    title: 'Hydration & Vitals',
    text: 'Drinking a glass of room temperature water 30 minutes before meals aids smooth digestion and vascular elasticity.',
    category: 'Hydration',
  },
  {
    title: 'Medication Adherence',
    text: 'Setting your medicine next to your morning glass of water or toothbrush anchors healthy habits to established daily routines.',
    category: 'Habits',
  },
  {
    title: 'Post-Meal Movement',
    text: 'A light 10-minute stroll after lunch or dinner can blunt glucose spikes by up to 25% without placing stress on the heart.',
    category: 'Metabolism',
  },
  {
    title: 'Restorative Sleep',
    text: 'Deep sleep lowers resting cortisol and allows the arterial system to rest and recover.',
    category: 'Recovery',
  },
  {
    title: 'Stress & Blood Pressure',
    text: 'Taking 3 slow diaphragmatic breaths (inhale 4 seconds, exhale 6 seconds) activates the parasympathetic calming response.',
    category: 'Cardiovascular',
  },
];

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const user = queryOne<{ full_name: string }>(db, 'SELECT full_name FROM users WHERE id = ?', [userId]);
    const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);

    // Water tracker check/reset for today
    let dailyWater = profile?.daily_water_glasses || 0;
    if (profile && profile.water_updated_date !== todayStr) {
      dailyWater = 0;
      db.run('UPDATE profiles SET daily_water_glasses = 0, water_updated_date = ? WHERE user_id = ?', [todayStr, userId]);
      saveDb();
    }

    // Conditions
    const conditions = queryAll<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE user_id = ?',
      [userId]
    ).map(c => c.condition_name);

    // Medicines and today's schedule
    const medicines = queryAll(db, 'SELECT * FROM medicines WHERE user_id = ?', [userId]);
    const careChecklists = queryAll(db, 'SELECT * FROM care_checklists WHERE user_id = ? AND is_enabled = 1', [userId]);
    const intakeLogs = queryAll(db, 'SELECT * FROM intake_logs WHERE user_id = ? AND scheduled_date = ?', [userId, todayStr]);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let totalDoses = 0;
    let takenDoses = 0;
    let nextUpcomingDose: any = null;
    let minUpcomingDiff = Infinity;

    // Evaluate medicines for today
    for (const med of medicines) {
      let times: string[] = [];
      try {
        times = JSON.parse(med.times_of_day);
      } catch {
        times = [med.times_of_day || '08:00'];
      }

      for (const t of times) {
        totalDoses++;
        const log = intakeLogs.find(l => l.medicine_id === med.id && l.scheduled_time === t);
        const status = log ? log.status : 'pending';
        if (status === 'taken') {
          takenDoses++;
        }

        const [h, m] = t.split(':').map(Number);
        const doseMinutes = h * 60 + m;

        if (status === 'pending') {
          let diff = doseMinutes - currentMinutes;
          if (diff < 0) diff += 1440; // tomorrow's cycle
          if (diff < minUpcomingDiff) {
            minUpcomingDiff = diff;
            nextUpcomingDose = {
              type: 'medicine',
              name: med.name,
              dose: med.dose,
              time: t,
              mealTiming: med.meal_timing,
              stockQuantity: med.stock_quantity,
            };
          }
        }
      }
    }

    // Care checklists for today
    for (const chk of careChecklists) {
      totalDoses++;
      const t = chk.scheduled_time || '08:00';
      const log = intakeLogs.find(l => l.care_checklist_id === chk.id && l.scheduled_time === t);
      const status = log ? log.status : 'pending';
      if (status === 'taken') {
        takenDoses++;
      }

      if (status === 'pending' && !nextUpcomingDose) {
        nextUpcomingDose = {
          type: 'care_checklist',
          name: chk.title,
          time: t,
        };
      }
    }

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const logs = queryAll(db, 'SELECT status FROM intake_logs WHERE user_id = ? AND scheduled_date = ?', [userId, dateStr]);
      if (logs.length > 0 && logs.some(l => l.status === 'taken')) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Today's meal snapshot from active diet plan
    const dietRow = queryOne(db, 'SELECT days_json FROM diet_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
    let todayMeals = null;
    if (dietRow) {
      try {
        const days = JSON.parse(dietRow.days_json);
        todayMeals = days.find((d: any) => d.day.toLowerCase() === dayOfWeek.toLowerCase()) || days[0];
      } catch (e) {
        todayMeals = null;
      }
    }

    // Today's workout snapshot from active exercise plan
    const exerciseRow = queryOne(db, 'SELECT days_json FROM exercise_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
    let todayWorkout = null;
    if (exerciseRow) {
      try {
        const days = JSON.parse(exerciseRow.days_json);
        todayWorkout = days.find((d: any) => d.day.toLowerCase() === dayOfWeek.toLowerCase()) || days[0];
      } catch (e) {
        todayWorkout = null;
      }
    }

    // Today's health tip
    const tipIndex = (new Date().getDate() + (conditions.length ? conditions[0].charCodeAt(0) : 0)) % HEALTH_TIPS.length;
    const dailyTip = HEALTH_TIPS[tipIndex];

    // Low stock warnings
    const lowStockCount = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM medicines WHERE user_id = ? AND stock_quantity <= 5',
      [userId]
    )?.count || 0;

    const medPercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    res.json({
      success: true,
      data: {
        userName: user?.full_name || 'Friend',
        dayOfWeek,
        date: todayStr,
        medicineProgress: {
          total: totalDoses,
          taken: takenDoses,
          percentage: medPercentage,
          allCompleted: totalDoses > 0 && takenDoses === totalDoses,
        },
        nextUpcomingDose,
        streak,
        dailyWater: {
          glasses: dailyWater,
          targetGlasses: 8,
          liters: Number((dailyWater * 0.25).toFixed(1)),
        },
        todayMeals,
        todayWorkout,
        dailyTip,
        conditions,
        lowStockCount,
      },
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard summary' });
  }
});

// Update water tracker count (+1 or -1 or custom)
router.post('/water', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { action, amount } = req.body; // action: 'increment' | 'decrement' | 'set'

    const db = await getDb();
    const todayStr = new Date().toISOString().slice(0, 10);

    const profile = queryOne<{ daily_water_glasses: number; water_updated_date: string }>(
      db,
      'SELECT daily_water_glasses, water_updated_date FROM profiles WHERE user_id = ?',
      [userId]
    );

    let current = profile?.daily_water_glasses || 0;
    if (profile?.water_updated_date !== todayStr) {
      current = 0;
    }

    if (action === 'increment') {
      current += (amount || 1);
    } else if (action === 'decrement') {
      current = Math.max(0, current - (amount || 1));
    } else if (action === 'set') {
      current = Math.max(0, Number(amount) || 0);
    }

    db.run(
      'UPDATE profiles SET daily_water_glasses = ?, water_updated_date = ? WHERE user_id = ?',
      [current, todayStr, userId]
    );
    saveDb();

    res.json({
      success: true,
      data: {
        glasses: current,
        liters: Number((current * 0.25).toFixed(1)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update water intake' });
  }
});

export default router;
