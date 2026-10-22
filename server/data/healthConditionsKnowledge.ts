export interface ConditionKnowledge {
  name: string;
  displayName: string;
  description: string;
  foodsToInclude: string[];
  foodsToLimit: string[];
  mealTimingTips: string[];
  dailyWaterLiters: number;
  safeExercises: string[];
  exerciseIntensity: string;
  exerciseCautions: string[];
  careChecklist?: Array<{
    title: string;
    defaultTime: string;
    frequency: string;
    description: string;
  }>;
  doctorClearanceRequired?: boolean;
  dietAdviceBlocked?: boolean;
  blockedMessage?: string;
  contraindications?: string[];
}

export const HEALTH_CONDITIONS_KB: Record<string, ConditionKnowledge> = {
  diabetes: {
    name: 'diabetes',
    displayName: 'Type 2 Diabetes / Prediabetes',
    description: 'Blood sugar regulation with focus on low glycemic index foods, complex fibers, and steady energy release.',
    foodsToInclude: [
      'Non-starchy vegetables (spinach, broccoli, zucchini, bell peppers)',
      'High-fiber legumes (lentils, chickpeas, black beans)',
      'Whole grains (quinoa, steel-cut oats, brown rice, barley)',
      'Healthy fats (avocados, extra virgin olive oil, walnuts, chia seeds)',
      'Lean proteins (tofu, paneer, skinless poultry, eggs, wild fish)',
      'Berries (blueberries, raspberries, strawberries)'
    ],
    foodsToLimit: [
      'Refined sugars, syrups, candies, and sugary sodas',
      'White bread, refined pastries, and white rice in excess',
      'Fruit juices and dried sweetened fruits',
      'Ultra-processed snacks with high glycemic starch',
      'Trans fats and deep-fried fast food'
    ],
    mealTimingTips: [
      'Eat meals at consistent times daily to avoid glucose spikes and crashes',
      'Pair carbohydrates with protein or healthy fats to slow glucose absorption',
      'Avoid skipping breakfast; keep dinner light and finished 2-3 hours before sleep',
      'Keep a gap of 3 to 4 hours between main meals'
    ],
    dailyWaterLiters: 2.8,
    safeExercises: [
      'Brisk walking (30 mins daily, ideally after meals)',
      'Moderate resistance training (bodyweight squats, resistance bands)',
      'Cycling or stationary biking',
      'Gentle swimming and water aerobics',
      'Hatha yoga and stress-reducing breathwork'
    ],
    exerciseIntensity: 'Moderate (RPE 4-6 out of 10)',
    exerciseCautions: [
      'Check blood sugar before exercising if taking insulin or sulfonylureas',
      'Always carry 15g fast-acting glucose (e.g. glucose tablets or juice box)',
      'Inspect feet daily before and after workouts for blisters or cuts',
      'Wear supportive, properly fitting athletic shoes with breathable socks'
    ],
    careChecklist: [
      {
        title: 'Fasting Blood Sugar Check',
        defaultTime: '07:30',
        frequency: 'daily',
        description: 'Measure morning fasting capillary blood glucose'
      },
      {
        title: 'Post-Meal Glucose Log',
        defaultTime: '14:00',
        frequency: 'daily',
        description: 'Check blood glucose 2 hours after largest meal'
      },
      {
        title: 'Daily Foot Inspection',
        defaultTime: '21:30',
        frequency: 'daily',
        description: 'Examine feet, heels, and between toes for redness or sores'
      }
    ]
  },

  hypertension: {
    name: 'hypertension',
    displayName: 'Hypertension (High Blood Pressure)',
    description: 'DASH-aligned nutrition focusing on high potassium, magnesium, calcium, and low sodium intake.',
    foodsToInclude: [
      'Potassium-rich vegetables (leafy greens, sweet potatoes, beets, tomatoes)',
      'Potassium-rich fruits (bananas, oranges, cantaloupe, pomegranates)',
      'Unsalted seeds and nuts (flaxseeds, pumpkin seeds, almonds)',
      'Low-fat dairy or fortified plant milks for calcium',
      'Whole grain oats and amaranth',
      'Garlic, lemon juice, and herbs for salt-free flavoring'
    ],
    foodsToLimit: [
      'Table salt (aim for under 1,500mg - 2,000mg sodium daily)',
      'Cured meats, bacon, canned soups, and salty condiments/pickles',
      'Processed frozen meals and salted chips',
      'Excess caffeine and energy drinks',
      'Excessive licorice or high-sodium broths'
    ],
    mealTimingTips: [
      'Spread meals evenly to maintain stable circulatory demand',
      'Season with citrus, sumac, and fragrant herbs rather than salt shakers',
      'Stay hydrated throughout the day to support vascular elasticity'
    ],
    dailyWaterLiters: 2.5,
    safeExercises: [
      'Brisk outdoor walking or treadmill incline walks',
      'Cycling on level surfaces or stationary bike',
      'Low-impact continuous swimming',
      'Light to moderate circuit training with high reps',
      'Pranayama / slow diaphragmatic breathing exercises'
    ],
    exerciseIntensity: 'Moderate aerobic (RPE 4-6 out of 10)',
    exerciseCautions: [
      'Avoid heavy maximal weightlifting, breath-holding (Valsalva maneuver), or straining',
      'Gradual 5-10 minute warm-up and cool-down are critical to prevent sudden BP surges',
      'Avoid inverted postures (e.g., headstands or extreme backbends)',
      'Stop immediately if you experience dizziness, chest tightness, or ear ringing'
    ],
    careChecklist: [
      {
        title: 'Morning Blood Pressure Check',
        defaultTime: '08:15',
        frequency: 'daily',
        description: 'Sit quietly for 5 minutes before cuff measurement'
      },
      {
        title: 'Evening Blood Pressure Check',
        defaultTime: '20:30',
        frequency: 'daily',
        description: 'Record seated resting blood pressure before bedtime'
      }
    ]
  },

  thyroid: {
    name: 'thyroid',
    displayName: 'Thyroid Conditions (Hypo / Hyper)',
    description: 'Nutrient-dense support with selenium, zinc, iodine balance, and precise medication timing.',
    foodsToInclude: [
      'Selenium-rich foods (Brazil nuts - 2 per day, eggs, sunflower seeds)',
      'Zinc sources (pumpkin seeds, lentils, whole grains, yogurt)',
      'Cooked cruciferous vegetables (lightly steamed rather than raw)',
      'Antioxidant-rich berries and colored bell peppers',
      'Clean lean proteins for basal metabolic support'
    ],
    foodsToLimit: [
      'Large amounts of raw goitrogenic vegetables (raw cabbage, raw kale)',
      'Excess unfermented soy products close to medication timing',
      'Highly refined carbohydrates and inflammatory trans fats',
      'Gluten if diagnosed with autoimmune Hashimoto thyroiditis'
    ],
    mealTimingTips: [
      'CRITICAL: Take thyroid medication on an empty stomach with a full glass of water at least 30-60 minutes before breakfast or coffee',
      'Do not take calcium or iron supplements within 4 hours of thyroid hormone'
    ],
    dailyWaterLiters: 2.5,
    safeExercises: [
      'Moderate brisk walking',
      'Gentle low-impact strength training',
      'Pilates and restorative yoga',
      'Swimming for joint comfort if experiencing sluggish fatigue'
    ],
    exerciseIntensity: 'Low to Moderate',
    exerciseCautions: [
      'Listen to energy levels and avoid overtraining or extreme HIIT during fatigue spells',
      'Keep hydrated and maintain steady warm-ups'
    ],
    careChecklist: [
      {
        title: 'Thyroid Medicine on Empty Stomach',
        defaultTime: '06:30',
        frequency: 'daily',
        description: 'Take levothyroxine with plain water 30-60 mins before food/coffee'
      }
    ]
  },

  pcos: {
    name: 'pcos',
    displayName: 'PCOS (Polycystic Ovary Syndrome)',
    description: 'Hormone and insulin balancing protocol with anti-inflammatory whole foods and high dietary fiber.',
    foodsToInclude: [
      'High-fiber vegetables (asparagus, leafy greens, green beans)',
      'Anti-inflammatory spices (turmeric, cinnamon, ginger)',
      'Omega-3 fatty acids (salmon, chia seeds, walnuts)',
      'Low GI complex carbs (quinoa, wild rice, lentils)',
      'Quality plant proteins and lean poultry'
    ],
    foodsToLimit: [
      'Sugary pastries, desserts, sweetened drinks',
      'Processed carbohydrates with high glycemic index',
      'Dairy products if acne or sensitivity occurs',
      'Excess saturated fats and hydrogenated vegetable oils'
    ],
    mealTimingTips: [
      'Have protein-rich breakfast within 90 minutes of waking',
      'Incorporate cinnamon into tea or porridge for insulin sensitivity',
      'Eat high-fiber meals every 3-4 hours to prevent hypoglycemia'
    ],
    dailyWaterLiters: 2.7,
    safeExercises: [
      'Progressive strength training (2-3 times weekly)',
      'Zone 2 steady-state cardio (brisk walking, rowing, cycling)',
      'HIIT in short controlled bursts (under 20 minutes)',
      'Yoga and somatic stretching for cortisol regulation'
    ],
    exerciseIntensity: 'Moderate to High with recovery focus',
    exerciseCautions: [
      'Avoid chronic high-cortisol endurance sessions without adequate rest',
      'Ensure proper sleep hygiene and post-workout recovery'
    ],
    careChecklist: [
      {
        title: 'Hydration & Cinnamon Tea Check',
        defaultTime: '11:00',
        frequency: 'daily',
        description: 'Mid-morning anti-inflammatory herbal tea and water goal'
      }
    ]
  },

  'high cholesterol': {
    name: 'high cholesterol',
    displayName: 'Hyperlipidemia / High Cholesterol',
    description: 'Soluble fiber and plant sterol enhancement to bind LDL cholesterol and boost HDL.',
    foodsToInclude: [
      'Soluble fiber foods (steel-cut oats, oat bran, barley, psyllium husk)',
      'Legumes and kidney beans',
      'Tree nuts (almonds, walnuts) in measured portions',
      'Extra virgin olive oil and avocado oil',
      'Fatty fish rich in EPA/DHA omega-3s',
      'Apples, citrus fruits, and berries with natural pectin'
    ],
    foodsToLimit: [
      'Saturated fats from fatty cuts of beef/pork, butter, and palm oil',
      'Trans fats (commercial baked pastries, partially hydrogenated margarines)',
      'Full-fat processed dairy and heavy cream',
      'Fried fast foods and processed snack chips'
    ],
    mealTimingTips: [
      'Start breakfast with a hearty bowl of soluble fiber oats',
      'Snack on a small handful (28g) of raw unsalted walnuts or almonds'
    ],
    dailyWaterLiters: 2.6,
    safeExercises: [
      'Brisk aerobic walking (40-45 minutes, 4-5 times a week)',
      'Swimming laps',
      'Moderate resistance training to improve lipid oxidation',
      'Cycling'
    ],
    exerciseIntensity: 'Moderate aerobic (RPE 5-7)',
    exerciseCautions: [
      'If taking statins and experiencing muscle cramping, notify your physician',
      'Maintain steady hydration'
    ],
    careChecklist: [
      {
        title: 'Morning Soluble Fiber Check',
        defaultTime: '08:30',
        frequency: 'daily',
        description: 'Include oats, chia, or psyllium with breakfast'
      }
    ]
  },

  'heart disease': {
    name: 'heart disease',
    displayName: 'Cardiovascular Disease / Heart Health',
    description: 'Cardioprotective nutrition with strict clinical oversight.',
    foodsToInclude: [
      'Antioxidant-dense leafy greens and cruciferous vegetables',
      'Omega-3 rich foods',
      'Whole legumes and intact whole grains',
      'Garlic, onions, and berry flavonoids'
    ],
    foodsToLimit: [
      'Sodium above 1,500mg per day',
      'Saturated and trans fats',
      'Refined sugars and processed meats'
    ],
    mealTimingTips: [
      'Eat smaller, frequent meals to avoid postprandial cardiovascular strain'
    ],
    dailyWaterLiters: 2.0, // Water restriction may be advised by doctor
    safeExercises: [
      'Gentle, doctor-supervised walking on level surfaces',
      'Light range-of-motion stretching',
      'Gentle chair yoga'
    ],
    exerciseIntensity: 'Light aerobic only (RPE 2-4 out of 10)',
    exerciseCautions: [
      'Requires explicit doctor clearance before any structured workout',
      'Keep heart rate strictly within physician-prescribed target zones',
      'Stop immediately if experiencing chest discomfort, breathlessness, or lightheadedness'
    ],
    doctorClearanceRequired: true,
    careChecklist: [
      {
        title: 'Morning Pulse & BP Log',
        defaultTime: '08:00',
        frequency: 'daily',
        description: 'Record resting heart rate and blood pressure'
      },
      {
        title: 'Symptom & Medication Check',
        defaultTime: '19:00',
        frequency: 'daily',
        description: 'Verify all cardiac medications taken; monitor for ankle swelling'
      }
    ]
  },

  asthma: {
    name: 'asthma',
    displayName: 'Asthma & Respiratory Care',
    description: 'Anti-inflammatory foods rich in vitamins C, D, and magnesium to support airway comfort.',
    foodsToInclude: [
      'Citrus fruits, kiwi, bell peppers for vitamin C',
      'Magnesium sources (pumpkin seeds, spinach, dark chocolate >75%)',
      'Carrots, sweet potatoes for beta-carotene',
      'Ginger and warm herbal infusions'
    ],
    foodsToLimit: [
      'Sulfites (found in wine, dried fruit, pickling liquids)',
      'Foods causing acid reflux (which triggers bronchospasm)',
      'Artificial food colorings and chemical preservatives'
    ],
    mealTimingTips: [
      'Avoid heavy late-night meals that cause gastroesophageal reflux',
      'Drink warm water during cold morning weather'
    ],
    dailyWaterLiters: 2.7,
    safeExercises: [
      'Indoor swimming (warm, humid air is gentle on airways)',
      'Walking in moderate climates',
      'Yoga and pranayama breathing control (Buteyko style)',
      'Gentle bodyweight resistance'
    ],
    exerciseIntensity: 'Moderate with extended warm-ups',
    exerciseCautions: [
      'Always have your rescue inhaler (e.g. Albuterol) within arm’s reach during exercise',
      'Perform a thorough 15-minute gradual warm-up',
      'Avoid outdoor exercise in cold, dry air or high pollen count days without a scarf or mask',
      'Stop immediately if wheezing or coughing starts'
    ],
    careChecklist: [
      {
        title: 'Carry Rescue Inhaler Check',
        defaultTime: '07:45',
        frequency: 'daily',
        description: 'Confirm rescue inhaler is in pocket/bag before leaving home'
      },
      {
        title: 'Peak Flow / Breathing Check',
        defaultTime: '20:00',
        frequency: 'daily',
        description: 'Assess evening airway comfort and inhaler count'
      }
    ]
  },

  obesity: {
    name: 'obesity',
    displayName: 'Healthy Weight Management / Obesity Support',
    description: 'High-satiety, nutrient-dense nutrition with volume eating (high water/fiber, moderate protein) and joint-friendly movement.',
    foodsToInclude: [
      'High-volume leafy salads and crunchy vegetables',
      'Lean protein at every meal (25-30g) for thermogenesis and satiety',
      'Clear broths and vegetable soups to start meals',
      'Whole fruits with skin instead of juices',
      'Low-fat Greek yogurt or cottage cheese'
    ],
    foodsToLimit: [
      'Liquid calories (frappes, sodas, energy drinks, juices)',
      'Calorie-dense fried foods and creamy dressings',
      'Ultra-processed snack foods and refined confectioneries'
    ],
    mealTimingTips: [
      'Drink 500ml water 20 minutes before each main meal',
      'Eat mindfully without screens; chew thoroughly for at least 20 minutes',
      'Close the kitchen after dinner to eliminate mindless late-night snacking'
    ],
    dailyWaterLiters: 3.0,
    safeExercises: [
      'Walking progression (start with 15 mins twice a day, build to 8,000 steps)',
      'Water aerobics and lap swimming (zero joint impact)',
      'Recumbent stationary cycling',
      'Seated resistance band exercises and supported squats'
    ],
    exerciseIntensity: 'Low to Moderate progressive',
    exerciseCautions: [
      'Protect knees and lower back; avoid high-impact jumping or plyometrics',
      'Wear shock-absorbing athletic shoes',
      'Gradually increase volume before increasing intensity'
    ],
    careChecklist: [
      {
        title: 'Morning Weight & Hydration Log',
        defaultTime: '07:15',
        frequency: 'daily',
        description: 'Record body weight fasted; drink 2 glasses of water'
      },
      {
        title: 'Daily Step Goal Check',
        defaultTime: '18:00',
        frequency: 'daily',
        description: 'Track daily walking progress towards step target'
      }
    ]
  },

  arthritis: {
    name: 'arthritis',
    displayName: 'Arthritis & Joint Inflammation',
    description: 'Anti-inflammatory Mediterranean-style eating with joint-lubricating healthy fats and collagen support.',
    foodsToInclude: [
      'Fatty fish (salmon, sardines, mackerel)',
      'Extra virgin olive oil and walnuts',
      'Turmeric with black pepper and fresh ginger',
      'Bone broths or collagen-rich soups',
      'Dark berries (cherries, blackberries) rich in anthocyanins'
    ],
    foodsToLimit: [
      'High-fructose corn syrup and processed snacks',
      'Red meat and processed sausages',
      'Refined white flours and deep-fried items',
      'Nightshades (tomatoes, eggplant, bell peppers) only if personal sensitivity exists'
    ],
    mealTimingTips: [
      'Enjoy golden turmeric milk in the evening for soothing joint stiffness'
    ],
    dailyWaterLiters: 2.5,
    safeExercises: [
      'Warm water hydrotherapy or pool walking',
      'Gentle tai chi and mobility flows',
      'Elliptical trainer or smooth recumbent bicycle',
      'Isometric joint strengthening exercises'
    ],
    exerciseIntensity: 'Low-impact, gentle range-of-motion',
    exerciseCautions: [
      'Never exercise through acute sharp joint pain or swollen inflamed flare-ups',
      'Warm up joints gently before exercise; apply warm compress if stiff',
      'Avoid high-impact running on asphalt or heavy jumping'
    ],
    careChecklist: [
      {
        title: 'Morning Joint Mobility Stretch',
        defaultTime: '07:30',
        frequency: 'daily',
        description: '5-minute gentle range of motion exercises before getting out of bed'
      }
    ]
  },

  'kidney issues': {
    name: 'kidney issues',
    displayName: 'Kidney Health (CKD / Renal Conditions)',
    description: 'Specialized renal nutrition requires strict individual lab work monitoring (GFR, creatinine, potassium, phosphorus, protein).',
    foodsToInclude: [
      'Doctor-cleared fresh vegetables (cabbage, cauliflower, red bell peppers)',
      'Apples, berries, pineapple (lower potassium fruits)',
      'White rice and plain pasta as directed by renal dietitian',
      'Measured amounts of high-biological-value protein only as prescribed'
    ],
    foodsToLimit: [
      'High sodium foods and salt substitutes containing potassium chloride',
      'High-potassium foods (bananas, potatoes, tomatoes) unless cleared by lab results',
      'High-phosphorus foods (colly colas, processed cheeses, organ meats)',
      'Excess protein powder supplements'
    ],
    mealTimingTips: [
      'Carefully adhere to portion sizes calculated by your registered renal dietitian'
    ],
    dailyWaterLiters: 1.8, // Often restricted based on dialysis/stage
    safeExercises: [
      'Light casual walking on flat ground',
      'Gentle chair mobility exercises'
    ],
    exerciseIntensity: 'Very light',
    exerciseCautions: [
      'Strict medical clearance required',
      'Do not perform strenuous exercise during fluid-overload states'
    ],
    doctorClearanceRequired: true,
    dietAdviceBlocked: true,
    blockedMessage: 'Because kidney conditions require precise clinical management of electrolytes (potassium, phosphorus, sodium) and fluid balance based on your blood work, please consult your nephrologist or registered renal dietitian for a personalized medical nutrition plan.',
    careChecklist: [
      {
        title: 'Daily Fluid & Blood Pressure Log',
        defaultTime: '08:00',
        frequency: 'daily',
        description: 'Record morning seated blood pressure and fluid balance',
      },
    ],
  },

  anemia: {
    name: 'anemia',
    displayName: 'Iron Deficiency & Anemia',
    description: 'Optimizing bioavailable heme and non-heme iron absorption paired with vitamin C enhancers.',
    foodsToInclude: [
      'Iron-rich legumes (lentils, black beans, edamame)',
      'Dark leafy greens (spinach, Swiss chard, moringa leaves)',
      'Vitamin C sources (lemons, bell peppers, oranges, guava) eaten with meals',
      'Pumpkin seeds, sesame seeds, and blackstrap molasses',
      'Lean meats or liver (if non-vegetarian)'
    ],
    foodsToLimit: [
      'Tea and coffee with meals (tannins inhibit iron absorption by up to 60%)',
      'High-dose calcium supplements taken at the same time as iron-rich meals'
    ],
    mealTimingTips: [
      'Separate tea, coffee, and dairy by at least 1-2 hours from your main iron-rich meals',
      'Always squeeze fresh lemon juice over cooked lentils and greens'
    ],
    dailyWaterLiters: 2.5,
    safeExercises: [
      'Low-intensity brisk walking',
      'Gentle restorative yoga',
      'Light dumbbell resistance with ample rest periods'
    ],
    exerciseIntensity: 'Low to Moderate',
    exerciseCautions: [
      'Take frequent rests; watch for lightheadedness or breathlessness upon standing',
      'Gradually increase workout duration as hemoglobin levels recover'
    ],
    careChecklist: [
      {
        title: 'Iron / Multivitamin Schedule',
        defaultTime: '10:00',
        frequency: 'daily',
        description: 'Take iron supplement with orange juice or water; avoid dairy/tea'
      }
    ]
  },

  none: {
    name: 'none',
    displayName: 'General Wellness & Preventive Health',
    description: 'Balanced whole-food nutrition, functional fitness, and preventive lifestyle habits.',
    foodsToInclude: [
      'Colorful rainbow of vegetables and fruits',
      'Balanced complex carbohydrates, whole grains, and legumes',
      'Quality lean proteins and healthy monounsaturated fats',
      'Fermented foods (kefir, yogurt, kimchi, sauerkraut) for gut health'
    ],
    foodsToLimit: [
      'Ultra-processed junk food and excessive refined sugar',
      'Artificial additives and sugary soft drinks'
    ],
    mealTimingTips: [
      'Maintain regular balanced meal intervals',
      'Hydrate with water and herbal infusions throughout the day'
    ],
    dailyWaterLiters: 2.7,
    safeExercises: [
      'Combined cardio and resistance training (3-4 days/week)',
      'HIIT, brisk walking, running, swimming',
      'Flexibility, mobility, and core conditioning'
    ],
    exerciseIntensity: 'Moderate to Vigorous (RPE 5-8)',
    exerciseCautions: [
      'Warm up for 5-10 minutes before workouts',
      'Prioritize proper lifting mechanics and progressive overload'
    ],
    careChecklist: [
      {
        title: 'Daily Water Goal Check',
        defaultTime: '15:00',
        frequency: 'daily',
        description: 'Verify at least 2 liters consumed by mid-afternoon'
      }
    ]
  }
};
