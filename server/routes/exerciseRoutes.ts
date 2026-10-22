import { Router, Response } from 'express';
import { getDb, queryOne, queryAll, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getGeminiClient } from '../config/gemini.js';
import { HEALTH_CONDITIONS_KB } from '../data/healthConditionsKnowledge.js';
import { Type } from '@google/genai';

const router = Router();

function generateFallbackExercisePlan(profile: any, conditions: string[]) {
  const hasHypertension = conditions.includes('hypertension');
  const hasDiabetes = conditions.includes('diabetes');
  const hasHeartDisease = conditions.includes('heart disease');
  const hasArthritis = conditions.includes('arthritis');
  const hasAsthma = conditions.includes('asthma');

  const days = [
    {
      day: 'Monday',
      title: 'Low-Impact Cardio & Core Stability',
      type: 'Cardio & Core',
      estimated_duration_mins: 30,
      estimated_calories: 180,
      cautions: hasHypertension ? 'Keep breathing steady. Do not hold your breath during core moves.' : 'Keep water handy.',
      warmup: [
        { name: 'Gentle Shoulder Rolls & Arm Circles', duration: '2 mins' },
        { name: 'Standing March in Place with High Knees', duration: '3 mins' },
      ],
      exercises: [
        {
          name: 'Brisk Walking or Low-Impact Step-Taps',
          sets: 3,
          reps: '3 mins',
          rest: '60 secs',
          howTo: 'Pump your arms in rhythm with a brisk, continuous gait keeping shoulders relaxed.',
          commonMistake: 'Slouching forward or stomping heels hard.',
          easierOption: 'March gently in place seated in a supportive chair.',
        },
        {
          name: 'Wall Push-Ups',
          sets: 3,
          reps: '10-12',
          rest: '45 secs',
          howTo: 'Stand arm-length from wall, hands flat at shoulder height. Lower chest toward wall, then press back.',
          commonMistake: 'Sagging hips or arching lower back.',
          easierOption: 'Step closer to the wall to decrease the angle.',
        },
        {
          name: 'Seated or Standing Torso Twists',
          sets: 3,
          reps: '12 each side',
          rest: '30 secs',
          howTo: 'Engage core gently, rotate upper body slowly from side to side with control.',
          commonMistake: 'Jerking or rotating too quickly.',
          easierOption: 'Perform seated with feet planted firmly.',
        },
      ],
      cooldown: [
        { name: 'Calf & Hamstring Gentle Stretch', duration: '3 mins' },
        { name: 'Deep Diaphragmatic Breathwork', duration: '2 mins' },
      ],
    },
    {
      day: 'Tuesday',
      title: 'Functional Strength & Joint Mobility',
      type: 'Strength & Mobility',
      estimated_duration_mins: 25,
      estimated_calories: 140,
      cautions: hasArthritis ? 'Move within a pain-free range of motion. Do not force joints.' : 'Control movement speed.',
      warmup: [
        { name: 'Ankle Circles & Wrist Rolls', duration: '2 mins' },
        { name: 'Torso Hugs & Side Reaches', duration: '3 mins' },
      ],
      exercises: [
        {
          name: 'Chair Sit-to-Stands (Assisted Squats)',
          sets: 3,
          reps: '8-10',
          rest: '60 secs',
          howTo: 'Sit on a sturdy chair, feet shoulder-width apart. Lean slightly forward and stand up using legs, then lower slowly.',
          commonMistake: 'Letting knees collapse inward.',
          easierOption: 'Use chair armrests for hand assistance.',
        },
        {
          name: 'Resistance Band or Light Dumbbell Bicep Curls',
          sets: 3,
          reps: '12',
          rest: '45 secs',
          howTo: 'Keep elbows tucked into sides, curl weight up with control, exhaling on exertion.',
          commonMistake: 'Swinging elbows back or arching back.',
          easierOption: 'Perform without added weights, focusing on mindful muscle contraction.',
        },
        {
          name: 'Standing Calf Raises',
          sets: 3,
          reps: '15',
          rest: '30 secs',
          howTo: 'Lightly hold a table or wall for balance, rise onto the balls of your feet, pause, and lower slowly.',
          commonMistake: 'Rushing the movement without pausing at top.',
          easierOption: 'Perform seated calf raises.',
        },
      ],
      cooldown: [
        { name: 'Chest Opener Stretch', duration: '2 mins' },
        { name: 'Seated Hamstring Stretch', duration: '3 mins' },
      ],
    },
    {
      day: 'Wednesday',
      title: 'Active Recovery & Guided Yoga Flow',
      type: 'Rest & Recovery',
      estimated_duration_mins: 20,
      estimated_calories: 90,
      cautions: 'Focus on relaxation, breath, and lowering stress hormones.',
      warmup: [
        { name: 'Cat-Cow Gentle Spine Flow', duration: '3 mins' },
      ],
      exercises: [
        {
          name: 'Gentle Warrior I Pose with Soft Knees',
          sets: 2,
          reps: '30 secs hold per side',
          rest: '30 secs',
          howTo: 'Step one foot forward into a slight lunge, extend arms overhead gently, breathe deeply.',
          commonMistake: 'Over-arching lower spine or forcing deep lunge.',
          easierOption: 'Keep feet closer together or hold a chair.',
        },
        {
          name: 'Supported Bridge Pose',
          sets: 2,
          reps: '45 secs hold',
          rest: '30 secs',
          howTo: 'Lie on back with knees bent, feet flat. Lift pelvis gently, supporting lower spine.',
          commonMistake: 'Overextending neck or pressing chin down hard.',
          easierOption: 'Keep hips resting on floor and perform pelvic tilts.',
        },
      ],
      cooldown: [
        { name: "Child's Pose / Restorative Stretch", duration: '3 mins' },
        { name: 'Savasana / Box Breathing (4-4-4-4)', duration: '5 mins' },
      ],
    },
    {
      day: 'Thursday',
      title: 'Aerobic Endurance & Steady-State Pace',
      type: 'Cardio',
      estimated_duration_mins: 30,
      estimated_calories: 190,
      cautions: hasAsthma ? 'Keep rescue inhaler nearby. Stay warm and hydrated.' : 'Maintain conversational breathing pace.',
      warmup: [
        { name: 'Side Step Taps & Arm Swings', duration: '3 mins' },
        { name: 'Light Knee Lifts', duration: '2 mins' },
      ],
      exercises: [
        {
          name: 'Stationary Cycling or Brisk Neighborhood Walk',
          sets: 1,
          reps: '20 mins continuous',
          rest: 'None',
          howTo: 'Maintain an even, moderate rhythm where you can speak a full sentence without gasping.',
          commonMistake: 'Starting out too fast and tiring prematurely.',
          easierOption: 'Break into two 10-minute intervals with a 2-minute seated rest.',
        },
      ],
      cooldown: [
        { name: 'Standing Quad Stretch (holding wall)', duration: '3 mins' },
        { name: 'Slow Controlled Exhalations', duration: '2 mins' },
      ],
    },
    {
      day: 'Friday',
      title: 'Full Body Gentle Resistance Training',
      type: 'Strength',
      estimated_duration_mins: 25,
      estimated_calories: 150,
      cautions: hasDiabetes ? 'Check blood sugar before starting; have glucose source ready.' : 'Focus on smooth repetitions.',
      warmup: [
        { name: 'Wrist & Hip Rotations', duration: '3 mins' },
      ],
      exercises: [
        {
          name: 'Glute Bridges',
          sets: 3,
          reps: '12',
          rest: '45 secs',
          howTo: 'Lie on your back with knees bent. Squeeze glutes and lift hips toward ceiling, hold for 1 second, lower.',
          commonMistake: 'Pushing through toes instead of heels.',
          easierOption: 'Small pulse lifts without full extension.',
        },
        {
          name: 'Seated Resistance Band Rows',
          sets: 3,
          reps: '12',
          rest: '45 secs',
          howTo: 'Loop band around feet while seated on floor or chair. Pull elbows back, squeezing shoulder blades together.',
          commonMistake: 'Shrugging shoulders up toward ears.',
          easierOption: 'Use a lighter resistance band or towel.',
        },
      ],
      cooldown: [
        { name: 'Spinal Twist on Floor/Chair', duration: '2 mins' },
        { name: 'Relaxation Meditation', duration: '3 mins' },
      ],
    },
    {
      day: 'Saturday',
      title: 'Weekend Outdoor Nature Walk or Swimming',
      type: 'Lifestyle Activity',
      estimated_duration_mins: 35,
      estimated_calories: 210,
      cautions: 'Enjoy fresh air and sunlight. Wear comfortable athletic footwear.',
      warmup: [
        { name: 'Dynamic Leg Swings', duration: '3 mins' },
      ],
      exercises: [
        {
          name: 'Nature Walk in Park / Leisure Lap Swimming',
          sets: 1,
          reps: '30 mins',
          rest: 'As needed',
          howTo: 'Walk or swim at a rhythmic, relaxed pace in a green environment.',
          commonMistake: 'Forgetting sun protection or water.',
          easierOption: 'Flat paved path with frequent park benches for resting.',
        },
      ],
      cooldown: [
        { name: 'Gentle Calves & Lower Back Release', duration: '5 mins' },
      ],
    },
    {
      day: 'Sunday',
      title: 'Full Rest & Restorative Meditation',
      type: 'Rest Day',
      estimated_duration_mins: 15,
      estimated_calories: 40,
      cautions: 'Rest is when your muscles and vascular system adapt and strengthen.',
      warmup: [],
      exercises: [
        {
          name: 'Pranayama / 4-7-8 Relaxing Breathwork',
          sets: 3,
          reps: '4 cycles',
          rest: '60 secs',
          howTo: 'Inhale through nose for 4 counts, hold for 7, exhale smoothly through mouth for 8 counts.',
          commonMistake: 'Straining or tensing shoulders during breath retention.',
          easierOption: 'Simple slow deep belly breathing.',
        },
      ],
      cooldown: [],
    },
  ];

  return {
    title: `${conditions.length ? conditions.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' & ') : 'Adaptive'} 7-Day Fitness Plan`,
    goal: profile?.goal || 'stay fit',
    fitness_level: profile?.activity_level || 'moderate',
    days,
    doctorClearanceRequired: hasHeartDisease,
    safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
  };
}

router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const conditions = queryAll<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE user_id = ?',
      [userId]
    ).map(c => c.condition_name);

    const planRow = queryOne(
      db,
      'SELECT * FROM exercise_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );

    if (!planRow) {
      const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);
      const plan = generateFallbackExercisePlan(profile, conditions);

      db.run(`
        INSERT INTO exercise_plans (user_id, week_start, title, goal, fitness_level, days_json)
        VALUES (?, date('now'), ?, ?, ?, ?)
      `, [userId, plan.title, plan.goal, plan.fitness_level, JSON.stringify(plan.days)]);
      saveDb();

      res.json({
        success: true,
        data: {
          id: 1,
          ...plan,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: planRow.id,
        title: planRow.title,
        goal: planRow.goal,
        fitness_level: planRow.fitness_level,
        days: JSON.parse(planRow.days_json),
        doctorClearanceRequired: conditions.includes('heart disease'),
        safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
      },
    });
  } catch (err: any) {
    console.error('Get exercise plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve exercise plan' });
  }
});

router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { timeAvailableMins, equipment } = req.body; // e.g. 30, 'dumbbells'

    const db = await getDb();
    const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const conditions = queryAll<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE user_id = ?',
      [userId]
    ).map(c => c.condition_name);

    const ai = getGeminiClient();
    let planData: any = null;

    if (ai) {
      try {
        const kbContext = conditions.map(c => {
          const kb = HEALTH_CONDITIONS_KB[c];
          return kb ? `${kb.displayName}: Safe [${kb.safeExercises.slice(0, 3).join(', ')}], Cautions [${kb.exerciseCautions.slice(0, 3).join(', ')}]` : '';
        }).filter(Boolean).join('; ');

        const prompt = `You are a clinical exercise physiologist designing a safe weekly exercise program for Healthify.
User details:
- Fitness level: ${profile?.activity_level || 'moderate'}
- Goal: ${profile?.goal || 'stay fit'}
- Time available: ${timeAvailableMins || 30} minutes per day
- Equipment available: ${equipment || 'Bodyweight / home'}
- Health conditions: ${conditions.join(', ') || 'none'}
- Clinical guidelines: ${kbContext}

CRITICAL RULES:
1. For heart disease or hypertension: NO maximal straining, NO heavy Valsalva maneuvers.
2. For diabetes: always advise checking blood glucose before/after; include safe walking after meals.
3. For asthma: extend warm-up, keep inhaler handy.
4. For arthritis: low-impact only, no heavy joint pounding.
5. Provide 7 days (Monday through Sunday) with title, type, estimated_duration_mins, estimated_calories, cautions, warmup, exercises, and cooldown.
6. For each exercise give: name, sets, reps, rest, howTo (short instructions), commonMistake, easierOption.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                goal: { type: Type.STRING },
                fitness_level: { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING },
                      title: { type: Type.STRING },
                      type: { type: Type.STRING },
                      estimated_duration_mins: { type: Type.INTEGER },
                      estimated_calories: { type: Type.INTEGER },
                      cautions: { type: Type.STRING },
                      warmup: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            duration: { type: Type.STRING },
                          },
                          required: ['name', 'duration'],
                        },
                      },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            sets: { type: Type.INTEGER },
                            reps: { type: Type.STRING },
                            rest: { type: Type.STRING },
                            howTo: { type: Type.STRING },
                            commonMistake: { type: Type.STRING },
                            easierOption: { type: Type.STRING },
                          },
                          required: ['name', 'sets', 'reps', 'howTo', 'easierOption'],
                        },
                      },
                      cooldown: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            duration: { type: Type.STRING },
                          },
                          required: ['name', 'duration'],
                        },
                      },
                    },
                    required: ['day', 'title', 'exercises'],
                  },
                },
              },
              required: ['title', 'days'],
            },
          },
        });

        planData = JSON.parse(response.text || '{}');
      } catch (geminiErr) {
        console.warn('Gemini exercise generation error, using fallback template:', geminiErr);
        planData = generateFallbackExercisePlan(profile, conditions);
      }
    } else {
      planData = generateFallbackExercisePlan(profile, conditions);
    }

    if (!planData || !planData.days) {
      planData = generateFallbackExercisePlan(profile, conditions);
    }

    db.run(`
      INSERT INTO exercise_plans (user_id, week_start, title, goal, fitness_level, days_json)
      VALUES (?, date('now'), ?, ?, ?, ?)
    `, [
      userId,
      planData.title || 'Personalized Exercise Routine',
      planData.goal || profile?.goal || 'stay fit',
      planData.fitness_level || profile?.activity_level || 'moderate',
      JSON.stringify(planData.days),
    ]);
    saveDb();

    res.json({
      success: true,
      message: 'Generated personalized exercise plan!',
      data: {
        ...planData,
        doctorClearanceRequired: conditions.includes('heart disease'),
        safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
      },
    });
  } catch (err: any) {
    console.error('Generate exercise plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate exercise plan' });
  }
});

// Log completed workout
router.post('/log-workout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dayName, durationMinutes, caloriesBurned, notes } = req.body;

    const db = await getDb();
    db.run(`
      INSERT INTO workout_logs (user_id, day_name, duration_minutes, calories_burned, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, dayName || 'Today Workout', Number(durationMinutes) || 25, Number(caloriesBurned) || 150, notes || '']);

    saveDb();

    res.json({ success: true, message: 'Workout logged! Outstanding effort!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to log workout' });
  }
});

// Get workout history / streaks
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const logs = queryAll(
      db,
      'SELECT * FROM workout_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 30',
      [userId]
    );

    const totalWorkouts = logs.length;
    const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    const totalCalories = logs.reduce((sum, l) => sum + (l.calories_burned || 0), 0);

    res.json({
      success: true,
      data: {
        totalWorkouts,
        totalMinutes,
        totalCalories,
        recentWorkouts: logs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch workout history' });
  }
});

export default router;
