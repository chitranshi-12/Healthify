import { Router, Response } from 'express';
import { getDb, queryOne, queryAll, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getGeminiClient } from '../config/gemini.js';
import { HEALTH_CONDITIONS_KB } from '../data/healthConditionsKnowledge.js';
import { Type } from '@google/genai';

const router = Router();

// Fallback template builder based on knowledge base and user profile
function generateFallbackDietPlan(profile: any, conditions: string[]) {
  const isVegetarian = profile?.food_preference === 'vegetarian' || profile?.food_preference === 'vegan';
  const isVegan = profile?.food_preference === 'vegan';
  const cuisine = profile?.cuisine || 'Mediterranean & Fresh Global';

  // Check conditions
  const hasDiabetes = conditions.includes('diabetes');
  const hasHypertension = conditions.includes('hypertension');
  const hasCholesterol = conditions.includes('high cholesterol');
  const hasAnemia = conditions.includes('anemia');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const days = daysOfWeek.map((dayName, idx) => {
    return {
      day: dayName,
      breakfast: {
        name: idx % 2 === 0
          ? 'Steel-Cut Oats with Chia Seeds, Walnuts & Blueberries'
          : 'Scrambled Tofu/Eggs with Spinach, Tomatoes & Sprouted Grain Toast',
        portion: '1 bowl / 2 slices',
        calories: 360,
        protein_g: 16,
        carbs_g: 44,
        fat_g: 12,
        reason: hasCholesterol || hasDiabetes
          ? 'Soluble beta-glucan fiber in oats slows glucose spikes and binds LDL cholesterol.'
          : 'High fiber with complex carbohydrates for sustained energy.',
      },
      midMorningSnack: {
        name: 'Crisp Apple Slices with Almond Butter or Roasted Edamame',
        portion: '1 medium apple + 1 tbsp nut butter',
        calories: 180,
        protein_g: 5,
        carbs_g: 22,
        fat_g: 9,
        reason: hasDiabetes ? 'Pectin fiber combined with healthy unsaturated fats stabilizes glycemic index.' : 'Nutrient-rich light bridge snack.',
      },
      lunch: {
        name: idx % 2 === 0
          ? 'Mediterranean Quinoa Bowl with Steamed Chickpeas, Cucumber, Bell Peppers & Olive Oil Lemon Vinaigrette'
          : 'Warm Brown Rice & Spiced Lentil Curry with Steamed Broccoli & Roasted Pumpkin Seeds',
        portion: '1 plate (approx 350g)',
        calories: 520,
        protein_g: 22,
        carbs_g: 68,
        fat_g: 14,
        reason: hasHypertension
          ? 'Rich in potassium and magnesium, virtually sodium-free with healthy polyphenols.'
          : 'High fiber plant protein combo.',
      },
      eveningSnack: {
        name: 'Herbal Cinnamon-Infused Green Tea with Unsalted Roasted Makhana (Fox Nuts) or Pumpkin Seeds',
        portion: '1 cup tea + 1 small bowl (30g)',
        calories: 130,
        protein_g: 4,
        carbs_g: 18,
        fat_g: 4,
        reason: hasDiabetes ? 'Cinnamon naturally supports insulin sensitivity; unsalted seeds provide magnesium.' : 'Antioxidant afternoon boost.',
      },
      dinner: {
        name: idx % 2 === 0
          ? (isVegan ? 'Grilled Tofu Steak with Roasted Asparagus & Garlic Herb Sweet Potato' : (isVegetarian ? 'Paneer Tikka with Sautéed Bell Peppers, Zucchini & 1 Multi-Grain Flatbread' : 'Baked Wild Salmon with Steamed Green Beans & Herbed Quinoa'))
          : 'Hearty Minestrone Soup with White Beans, Kale, Carrots & Extra Virgin Olive Oil Drizzle',
        portion: '1 serving',
        calories: 450,
        protein_g: 26,
        carbs_g: 42,
        fat_g: 15,
        reason: hasHypertension || hasCholesterol
          ? 'Low sodium, zero trans fats, high in heart-friendly cardioprotective omega-3 and potassium.'
          : 'High satiety, easy to digest evening meal.',
      },
    };
  });

  const groceryList = [
    { category: 'Produce', items: ['Spinach', 'Broccoli', 'Bell peppers', 'Zucchini', 'Blueberries', 'Apples', 'Lemons', 'Sweet potatoes', 'Garlic'] },
    { category: 'Pantry & Whole Grains', items: ['Steel-cut oats', 'Quinoa', 'Brown rice', 'Sprouted grain bread', 'Chia seeds', 'Raw walnuts', 'Almonds', 'Pumpkin seeds'] },
    { category: 'Proteins & Legumes', items: ['Chickpeas (dried/canned no salt)', 'Lentils', 'Tofu or Paneer', 'Eggs / Wild Salmon (if non-veg)', 'White beans'] },
    { category: 'Healthy Fats & Spices', items: ['Extra virgin olive oil', 'Cinnamon powder', 'Turmeric', 'Black pepper', 'Herbal green tea'] },
  ];

  return {
    title: `Balanced ${conditions.length ? conditions.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' & ') : 'Wellness'} 7-Day Nutrition Plan`,
    target_calories: 1750,
    target_protein: 80,
    target_carbs: 210,
    target_fat: 55,
    daily_water_goal_liters: hasHypertension ? 2.5 : 2.8,
    days,
    groceryList,
    conditionReasons: [
      'Emphasizes potassium and magnesium while strictly controlling sodium under DASH principles.',
      'Low glycemic load carbohydrates paired with healthy plant fats to avoid postprandial glucose surges.',
      'Generous soluble fiber to support healthy lipid metabolism and digestive microbiome.',
    ],
  };
}

router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    // Check conditions first
    const conditions = queryAll<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE user_id = ?',
      [userId]
    ).map(c => c.condition_name);

    if (conditions.includes('kidney issues')) {
      res.json({
        success: true,
        data: {
          isBlocked: true,
          blockedMessage: HEALTH_CONDITIONS_KB['kidney issues'].blockedMessage,
          doctorClearanceRequired: true,
        },
      });
      return;
    }

    const planRow = queryOne(
      db,
      'SELECT * FROM diet_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );

    if (!planRow) {
      // Auto-generate fallback initial plan
      const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);
      const plan = generateFallbackDietPlan(profile, conditions);

      db.run(`
        INSERT INTO diet_plans (
          user_id, week_start, title, target_calories, target_protein,
          target_carbs, target_fat, daily_water_goal_liters, days_json,
          grocery_list_json, condition_reasons_json
        ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        plan.title,
        plan.target_calories,
        plan.target_protein,
        plan.target_carbs,
        plan.target_fat,
        plan.daily_water_goal_liters,
        JSON.stringify(plan.days),
        JSON.stringify(plan.groceryList),
        JSON.stringify(plan.conditionReasons),
      ]);
      saveDb();

      res.json({
        success: true,
        data: {
          id: 1,
          ...plan,
          doctorClearanceRequired: conditions.includes('heart disease'),
          safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: planRow.id,
        title: planRow.title,
        target_calories: planRow.target_calories,
        target_protein: planRow.target_protein,
        target_carbs: planRow.target_carbs,
        target_fat: planRow.target_fat,
        daily_water_goal_liters: planRow.daily_water_goal_liters,
        days: JSON.parse(planRow.days_json),
        groceryList: JSON.parse(planRow.grocery_list_json || '[]'),
        conditionReasons: JSON.parse(planRow.condition_reasons_json || '[]'),
        doctorClearanceRequired: conditions.includes('heart disease'),
        safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
      },
    });
  } catch (err: any) {
    console.error('Get diet plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve diet plan' });
  }
});

router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const profile = queryOne(db, 'SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const conditions = queryAll<{ condition_name: string }>(
      db,
      'SELECT condition_name FROM conditions WHERE user_id = ?',
      [userId]
    ).map(c => c.condition_name);

    // Safety checks
    if (conditions.includes('kidney issues')) {
      res.json({
        success: true,
        data: {
          isBlocked: true,
          blockedMessage: HEALTH_CONDITIONS_KB['kidney issues'].blockedMessage,
          doctorClearanceRequired: true,
        },
      });
      return;
    }

    if (profile?.age && profile.age < 18) {
      res.status(400).json({
        success: false,
        message: 'Weight-loss or restrictive diet plans are not recommended for individuals under 18 without pediatric guidance.',
      });
      return;
    }

    const ai = getGeminiClient();

    let planData: any = null;

    if (ai) {
      try {
        const kbContext = conditions.map(c => {
          const kb = HEALTH_CONDITIONS_KB[c];
          return kb ? `${kb.displayName}: include [${kb.foodsToInclude.slice(0, 3).join(', ')}], limit [${kb.foodsToLimit.slice(0, 3).join(', ')}]` : '';
        }).filter(Boolean).join('; ');

        const prompt = `You are a clinical nutrition specialist creating a 7-day disease-adapted meal plan for Healthify.
User profile:
- Age: ${profile?.age || 35}, Gender: ${profile?.gender || 'not specified'}
- Height: ${profile?.height_cm || 170} cm, Weight: ${profile?.weight_kg || 70} kg
- Food preference: ${profile?.food_preference || 'vegetarian'}
- Cuisine preference: ${profile?.cuisine || 'Mediterranean & Global'}
- Food allergies: ${profile?.food_allergies || 'none'}
- Goal: ${profile?.goal || 'manage condition'}
- Health conditions: ${conditions.length ? conditions.join(', ') : 'none'}
- Knowledge base rules: ${kbContext}

CRITICAL SAFETY & MEDICAL RULES:
1. Never suggest crash diets or dangerously low calories (keep at least 1500 kcal).
2. NEVER suggest or modify medications.
3. Every condition food restriction must be respected. For diabetes, keep low GI. For hypertension, keep low sodium.
4. For each meal (breakfast, midMorningSnack, lunch, eveningSnack, dinner) give meal name, portion, calories, protein_g, carbs_g, fat_g, and a condition-specific medical reason when applicable.
5. Provide a categorised grocery list for the week.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                target_calories: { type: Type.INTEGER },
                target_protein: { type: Type.INTEGER },
                target_carbs: { type: Type.INTEGER },
                target_fat: { type: Type.INTEGER },
                daily_water_goal_liters: { type: Type.NUMBER },
                conditionReasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING },
                      breakfast: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          calories: { type: Type.INTEGER },
                          protein_g: { type: Type.INTEGER },
                          carbs_g: { type: Type.INTEGER },
                          fat_g: { type: Type.INTEGER },
                          reason: { type: Type.STRING },
                        },
                        required: ['name', 'calories'],
                      },
                      midMorningSnack: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          calories: { type: Type.INTEGER },
                          protein_g: { type: Type.INTEGER },
                          carbs_g: { type: Type.INTEGER },
                          fat_g: { type: Type.INTEGER },
                          reason: { type: Type.STRING },
                        },
                        required: ['name', 'calories'],
                      },
                      lunch: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          calories: { type: Type.INTEGER },
                          protein_g: { type: Type.INTEGER },
                          carbs_g: { type: Type.INTEGER },
                          fat_g: { type: Type.INTEGER },
                          reason: { type: Type.STRING },
                        },
                        required: ['name', 'calories'],
                      },
                      eveningSnack: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          calories: { type: Type.INTEGER },
                          protein_g: { type: Type.INTEGER },
                          carbs_g: { type: Type.INTEGER },
                          fat_g: { type: Type.INTEGER },
                          reason: { type: Type.STRING },
                        },
                        required: ['name', 'calories'],
                      },
                      dinner: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          calories: { type: Type.INTEGER },
                          protein_g: { type: Type.INTEGER },
                          carbs_g: { type: Type.INTEGER },
                          fat_g: { type: Type.INTEGER },
                          reason: { type: Type.STRING },
                        },
                        required: ['name', 'calories'],
                      },
                    },
                    required: ['day', 'breakfast', 'lunch', 'dinner'],
                  },
                },
                groceryList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['category', 'items'],
                  },
                },
              },
              required: ['title', 'target_calories', 'days', 'groceryList'],
            },
          },
        });

        planData = JSON.parse(response.text || '{}');
      } catch (geminiErr) {
        console.warn('Gemini generation encountered error, utilizing structured knowledge template fallback:', geminiErr);
        planData = generateFallbackDietPlan(profile, conditions);
      }
    } else {
      planData = generateFallbackDietPlan(profile, conditions);
    }

    if (!planData || !planData.days) {
      planData = generateFallbackDietPlan(profile, conditions);
    }

    // Save to database
    db.run(`
      INSERT INTO diet_plans (
        user_id, week_start, title, target_calories, target_protein,
        target_carbs, target_fat, daily_water_goal_liters, days_json,
        grocery_list_json, condition_reasons_json
      ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      planData.title || 'Personalized Healthify Meal Plan',
      planData.target_calories || 1800,
      planData.target_protein || 85,
      planData.target_carbs || 200,
      planData.target_fat || 55,
      planData.daily_water_goal_liters || 2.7,
      JSON.stringify(planData.days),
      JSON.stringify(planData.groceryList || []),
      JSON.stringify(planData.conditionReasons || []),
    ]);
    saveDb();

    res.json({
      success: true,
      message: 'Fresh personalized diet plan generated!',
      data: {
        ...planData,
        doctorClearanceRequired: conditions.includes('heart disease'),
        safetyDisclaimer: 'This is general guidance, not medical advice. Check with your doctor before starting.',
      },
    });
  } catch (err: any) {
    console.error('Generate diet plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate diet plan' });
  }
});

// Swap a meal for an alternate healthy option
router.post('/swap-meal', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { day, mealType } = req.body; // e.g. day: 'Monday', mealType: 'lunch'

    const db = await getDb();
    const planRow = queryOne(
      db,
      'SELECT * FROM diet_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );

    if (!planRow) {
      res.status(404).json({ success: false, message: 'No active diet plan found' });
      return;
    }

    const days = JSON.parse(planRow.days_json);
    const dayObj = days.find((d: any) => d.day.toLowerCase() === day.toLowerCase());

    if (!dayObj) {
      res.status(400).json({ success: false, message: 'Day not found in plan' });
      return;
    }

    // Alternative delicious healthy options
    const mealSwaps: Record<string, any[]> = {
      breakfast: [
        { name: 'Chia Seed & Almond Milk Pudding with Fresh Raspberries', portion: '1 glass', calories: 310, protein_g: 11, carbs_g: 34, fat_g: 13, reason: 'High in ALA omega-3 and soluble prebiotic fiber.' },
        { name: 'Avocado & Poached Egg on 100% Sprouted Rye Bread', portion: '1 thick slice', calories: 340, protein_g: 15, carbs_g: 28, fat_g: 16, reason: 'Monounsaturated fats with steady slow-burning carbs.' },
        { name: 'Warm Besan Chilla (Chickpea Flour Crepe) with Mint Chutney', portion: '2 small crepes', calories: 290, protein_g: 14, carbs_g: 38, fat_g: 7, reason: 'Low GI legume batter rich in plant protein and zinc.' },
      ],
      lunch: [
        { name: 'Mediterranean Lentil Salad with Chopped Cucumbers, Kalamata Olives & Tahini', portion: '1 large bowl', calories: 480, protein_g: 20, carbs_g: 58, fat_g: 15, reason: 'Complex resistant starch supporting intestinal microbiome.' },
        { name: 'Tofu & Vegetable Stir-Fry with Steamed Wild Rice', portion: '1 plate', calories: 460, protein_g: 24, carbs_g: 52, fat_g: 14, reason: 'Low sodium stir-fry with antioxidant vegetables.' },
      ],
      dinner: [
        { name: 'Spiced Black Bean Soup with Roasted Pumpkin & Cumin', portion: '1 deep bowl + side greens', calories: 420, protein_g: 19, carbs_g: 62, fat_g: 8, reason: 'Satiating, gentle on digestion before sleep.' },
        { name: 'Grilled Herb Tofu/Fish with Steamed Green Beans & Sautéed Mushrooms', portion: '1 plate', calories: 410, protein_g: 28, carbs_g: 26, fat_g: 14, reason: 'High protein, minimal glycemic load.' },
      ],
    };

    const alternatives = mealSwaps[mealType] || mealSwaps.lunch;
    const currentName = dayObj[mealType]?.name || '';
    const newMeal = alternatives.find(a => a.name !== currentName) || alternatives[0];

    dayObj[mealType] = newMeal;

    db.run('UPDATE diet_plans SET days_json = ? WHERE id = ?', [JSON.stringify(days), planRow.id]);
    saveDb();

    res.json({
      success: true,
      message: `Swapped ${mealType} with ${newMeal.name}`,
      data: { updatedMeal: newMeal, day, mealType },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to swap meal' });
  }
});

export default router;
