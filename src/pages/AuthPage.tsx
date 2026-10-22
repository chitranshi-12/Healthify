import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Pill,
  Utensils,
  HeartPulse,
  Activity,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Clock,
  X,
  Check,
  Send,
  Camera,
  Flame,
  ListChecks,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Droplet,
  Scale,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface AuthPageProps {
  onForgotPassword: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Google Multicolored 'G' SVG
const GoogleGIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Individual Feature Definitions (each with its OWN distinct description)
interface FeatureDetail {
  id: string;
  name: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  tag: string;
  color: string;
  description: string;
  capabilities: string[];
  patientTip: string;
}

const FEATURES_DATA: FeatureDetail[] = [
  {
    id: 'medicine-reminders',
    name: 'Smart Medicine Timelines',
    subtitle: 'Exact clock scheduling, meal rules & snooze',
    icon: Pill,
    tag: 'Core Adherence',
    color: 'emerald',
    description:
      'Never miss or double-dose again. Set exact clock times (HH:MM), customizable dosage forms (tablets, syrups, injections, drops, inhalers), and strict meal dependencies (before food, after food, or empty stomach). Overdue doses glow in high-visibility warning amber, and 1-tap "Snooze 10m" keeps track of real-world interruptions.',
    capabilities: [
      'Flexible dose schedule: daily, specific weekdays, or custom intervals',
      'Inventory tracking with automatic decrement on intake & low-stock alerts',
      'One-tap "Mark Taken", "Skip", or "Snooze for 10 minutes"',
      'Doctor prescription alignment note strictly reinforced across every screen',
    ],
    patientTip: 'Always take medicines with a full glass of water unless otherwise directed by your physician.',
  },
  {
    id: 'audio-chimes',
    name: 'In-App Harmonic Chime & Web Alerts',
    subtitle: 'Subtle sound notifications & browser alerts',
    icon: Clock,
    tag: 'Real-Time Audio',
    color: 'teal',
    description:
      'Healthify continuously runs an in-app ticker that pairs with the HTML5 Web Audio API to produce a soothing, harmonic dual-tone chime the second your medication is due. Polite desktop notifications keep you informed even while multitasking in other browser tabs.',
    capabilities: [
      'Calming synthesized 528Hz & 660Hz harmonic frequency chime (zero harsh buzzers)',
      'Modal alarm takeover with direct "Take Dose" and "Snooze" actions',
      'Polite browser notification permission workflow with non-blocking fallback',
      'Works seamlessly as an installed Progressive Web App (PWA)',
    ],
    patientTip: 'Keep the Healthify tab pinned or add it to your home screen for uninterrupted chime reminders.',
  },
  {
    id: 'prescription-scanner',
    name: 'AI Prescription OCR Scanner',
    subtitle: 'Snap a written script & review extracted items',
    icon: Camera,
    tag: 'Gemini Vision AI',
    color: 'amber',
    description:
      'Avoid tedious manual typing. Take a photo or upload an image of your doctor\'s prescription paper. Gemini Vision extracts medication titles, strengths, forms, frequencies, and instructions into a clean review table. You inspect and verify every item before saving.',
    capabilities: [
      'High-accuracy handwriting and printed text optical recognition',
      'Interactive review step: edit dose, change timing, or discard items before saving',
      'Strict safety guardrail: AI never alters doctor instructions or suggests dosage changes',
      'Supports JPG, PNG, and HEIC prescription photo uploads',
    ],
    patientTip: 'Hold the camera flat in bright lighting to ensure every medicine name and dosage line is legible.',
  },
  {
    id: 'diet-plans',
    name: 'Disease-Adapted 7-Day Nutrition',
    subtitle: 'Condition-safe meals with calorie & macro rings',
    icon: Utensils,
    tag: 'Clinical Nutrition',
    color: 'sky',
    description:
      'Personalized whole-food nutrition tailored specifically to your diagnosed conditions: DASH principles for hypertension (sodium under 1,500mg), low-glycemic complex carbohydrates for diabetes, and iron-vitamin C pairings for anemia. Respects your diet preferences (veg, vegan, non-veg, eggetarian), cuisines, and allergies.',
    capabilities: [
      'Detailed breakfast, mid-morning snack, lunch, evening snack, and dinner options',
      'Interactive meal swap button if you crave an alternative safe dish',
      'Visual macronutrient ring breakdown (carbs, proteins, healthy fats) and daily calories',
      'Automated 1-click weekly grocery shopping list organized by food aisle',
    ],
    patientTip: 'Drink 250ml of water 30 minutes before main meals to aid digestion and optimize nutrient absorption.',
  },
  {
    id: 'guided-workouts',
    name: 'Condition-Safe Movement & Workout Player',
    subtitle: 'Warm-ups, interval timers & common mistake tips',
    icon: Activity,
    tag: 'Physical Wellness',
    color: 'indigo',
    description:
      'Exercise safely without aggravating chronic conditions. High-blood-pressure routines avoid inverted or breath-holding postures; diabetes routines prioritize post-meal glucose clearing walks; arthritis routines emphasize zero-impact mobility. Features a full-screen guided workout player with interval beeps and rest timers.',
    capabilities: [
      'Step-by-step movement instructions with common mistake warnings and easy modifications',
      'Interactive audio-guided workout player with countdowns and 30-second rest intervals',
      'Weekly routine with built-in active recovery and rest days',
      'Instant logging of completed sessions with celebration confetti',
    ],
    patientTip: 'Never push through sharp joint pain. Slow down and switch to the provided low-impact modification.',
  },
  {
    id: 'vitals-adherence',
    name: 'Biometric Vitals & Adherence Engine',
    subtitle: 'Color-coded readings, emergency alerts & streaks',
    icon: HeartPulse,
    tag: 'Biometric Insights',
    color: 'rose',
    description:
      'Keep your health team informed with objective data. Record Blood Pressure (systolic/diastolic), Blood Glucose (fasting/post-meal), Body Weight, and Resting Heart Rate. Color-coded clinical status badges classify readings, while the 7-day adherence chart and streak counter keep motivation high.',
    capabilities: [
      'Instant clinical categorization: Normal, Elevated, High Stage 1, High Stage 2, or Critical',
      'Critical red-flag emergency alert banners with 1-tap 911 / EMS dialing shortcuts',
      'Interactive 7-day medication adherence percentage bar chart with streak counter',
      'Exportable vitals history for your next clinical doctor appointment',
    ],
    patientTip: 'Sit quietly for 5 minutes with your feet flat on the floor before taking a blood pressure reading.',
  },
];

// Individual Condition Definitions (each with its OWN distinct description)
interface ConditionDetail {
  id: string;
  name: string;
  badge: string;
  summary: string;
  dietRules: string[];
  foodsToAvoid: string[];
  exerciseGuidance: string[];
  careChecklist: { title: string; time: string; note: string }[];
}

const CONDITIONS_DATA: ConditionDetail[] = [
  {
    id: 'diabetes',
    name: 'Type 2 Diabetes & Prediabetes',
    badge: 'Low Glycemic Index',
    summary:
      'Focuses on stabilizing postprandial glucose swings, improving cellular insulin sensitivity, and slowing digestive carbohydrate absorption through high soluble resistant fiber.',
    dietRules: [
      'Prioritize non-starchy cruciferous vegetables (broccoli, spinach, cauliflower, kale)',
      'Pair all carbohydrates with lean protein or healthy unsaturated fats to flatten glucose curves',
      'Opt for low-GI complex grains: steel-cut oats, quinoa, brown rice, and sprouted lentils',
      'Snack on raw almonds, walnuts, chia seeds, and low-sugar antioxidant berries',
    ],
    foodsToAvoid: [
      'High-fructose corn syrup, refined white sugar, candy, and sweetened sodas',
      'Refined white flour breads, bakery pastries, and excessive white rice',
      'Fruit juices without pulp and dried sweetened fruits that trigger rapid glucose spikes',
    ],
    exerciseGuidance: [
      '30-minute moderate aerobic brisk walk (ideally 20-30 minutes after largest meal)',
      'Resistance training 2-3 times weekly with bodyweight or resistance bands',
      'Always inspect feet before and after movement for blisters or friction rub',
      'Carry 15g fast-acting glucose tablets in pocket during workouts',
    ],
    careChecklist: [
      { title: 'Morning Fasting Glucose Check', time: '07:30', note: 'Measure fasting capillary blood glucose before breakfast' },
      { title: 'Post-Lunch Glucose Log', time: '14:00', note: 'Check glucose 2 hours after your largest meal' },
      { title: 'Evening Foot & Heel Inspection', time: '21:30', note: 'Check toes and heels with a mirror for redness or cuts' },
    ],
  },
  {
    id: 'hypertension',
    name: 'Hypertension (High Blood Pressure)',
    badge: 'DASH Protocol',
    summary:
      'Strict Dietary Approaches to Stop Hypertension (DASH) framework emphasizing high potassium, magnesium, and calcium to relax arterial walls and lower vascular resistance.',
    dietRules: [
      'Limit total dietary sodium strictly under 1,500mg - 2,000mg per day',
      'Emphasize high-potassium foods: spinach, bananas, sweet potatoes, beets, and pomegranates',
      'Incorporate unsalted pumpkin seeds, chia seeds, and flaxseeds for magnesium support',
      'Flavor meals naturally with fresh lemon juice, garlic, rosemary, turmeric, and black pepper',
    ],
    foodsToAvoid: [
      'Canned soups, processed deli meats, sausages, hot dogs, and salted chips',
      'Pickles, soy sauce, bouillon cubes, and commercial salad dressings',
      'Excessive caffeine, energy drinks, and alcohol that cause acute vasoconstriction',
    ],
    exerciseGuidance: [
      'Rhythmic continuous aerobic exercise: brisk walking, stationary cycling, gentle swimming',
      'Maintain conversational pace (Rate of Perceived Exertion 4-6 out of 10)',
      'STRICTLY AVOID heavy isometric straining, inverted yoga poses, or holding breath (Valsalva)',
      'Include a gradual 5-minute cooldown walk after every session to prevent blood pooling',
    ],
    careChecklist: [
      { title: 'Morning Seated BP Check', time: '08:15', note: 'Sit still for 5 minutes before logging morning blood pressure' },
      { title: 'Evening Resting BP Check', time: '20:30', note: 'Record evening blood pressure before dinner' },
      { title: 'Hydration & Salt Monitor', time: '13:00', note: 'Verify low-sodium meal choices and water intake' },
    ],
  },
  {
    id: 'cholesterol',
    name: 'High Cholesterol (Hyperlipidemia)',
    badge: 'Soluble Beta-Glucans',
    summary:
      'Aimed at clearing circulating Low-Density Lipoprotein (LDL) cholesterol through gut-binding soluble beta-glucan fibers and polyphenol-rich plant sterols.',
    dietRules: [
      'Consume 1 bowl of steel-cut or rolled oats daily for heart-protective beta-glucans',
      'Use cold-pressed extra virgin olive oil as primary culinary cooking fat',
      'Incorporate 30g raw walnuts, chia seeds, or ground flaxseeds daily',
      'Include legumes (lentils, chickpeas, edamame) at least 4 times per week',
    ],
    foodsToAvoid: [
      'Full-fat dairy creams, butter, palm oil, coconut oil, and ghee in excess',
      'Processed cured meats, bacon, pepperoni, and commercial trans fats in baked goods',
      'Deep-fried fast foods and commercial batter-fried appetizers',
    ],
    exerciseGuidance: [
      'Brisk aerobic walking (40-45 minutes, 4-5 times a week) to stimulate HDL production',
      'Moderate resistance training with compound movements (squats, row pulls)',
      'Paced interval walking to support vascular endothelial elasticity',
    ],
    careChecklist: [
      { title: 'Morning Soluble Fiber Breakfast', time: '08:00', note: 'Ensure morning meal includes oats, barley, or chia' },
      { title: 'Daily Step Goal Target (8k steps)', time: '17:00', note: 'Check step progress to ensure lipid clearing activity' },
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid Health (Hypothyroidism & Hashimotos)',
    badge: 'Precision Empty Stomach Dosing',
    summary:
      'Centered around ensuring unhindered absorption of Levothyroxine while supplying essential trace micronutrients (selenium, zinc, iodine) for peripheral T4 to T3 conversion.',
    dietRules: [
      'Eat 2 Brazil nuts daily to deliver the clinical daily requirement of active selenium',
      'Enjoy thoroughly cooked cruciferous vegetables (cooking deactivates goitrogenic compounds)',
      'Include zinc-rich pumpkin seeds, lentils, lean poultry, and eggs',
      'Separate calcium supplements or iron tablets by at least 4 hours from thyroid medicine',
    ],
    foodsToAvoid: [
      'Unfermented raw soy products (raw tofu, soy flour, soy milk) within 4 hours of dosing',
      'Drinking espresso or black coffee within 60 minutes of taking thyroid medication',
      'Crash starvation diets that trigger reverse-T3 accumulation and slow basal metabolic rate',
    ],
    exerciseGuidance: [
      'Low-impact steady walking, restorative Hatha yoga, and gentle Pilates',
      'Respect energy fluctuations; swap high-intensity workouts for mobility on fatigue days',
      'Gentle resistance exercises to preserve lean muscle mass without triggering adrenal strain',
    ],
    careChecklist: [
      { title: 'CRITICAL: Thyroid Dose on Empty Stomach', time: '06:30', note: 'Take Levothyroxine with plain water 30-60m before any food or coffee' },
      { title: 'Mid-Day Energy & Hydration Check', time: '14:30', note: 'Check hydration and note energy or body temperature symptoms' },
    ],
  },
  {
    id: 'pcos',
    name: 'PCOS & Hormonal Balance',
    badge: 'Insulin Sensitization',
    summary:
      'Engineered to soothe hyperandrogenism and ovarian inflammation by regulating insulin resistance, lowering post-meal blood sugar surges, and reducing cortisol stress.',
    dietRules: [
      'Incorporate 30g+ of dietary fiber daily from leafy greens, berries, lentils, and flaxseeds',
      'Add functional spices: Ceylon cinnamon, ginger, and turmeric with black pepper',
      'Pair 25g-30g of protein at breakfast to blunt morning glucose spikes and reduce cravings',
      'Opt for omega-3 rich wild salmon, walnuts, chia seeds, and avocado',
    ],
    foodsToAvoid: [
      'Sugary breakfast cereals, sweet pastries, and packaged granola bars',
      'Commercial skim milk drinks and dairy beverages loaded with added corn syrups',
      'High-stress chronic fasting regimens that spike cortisol and destabilize cycle rhythms',
    ],
    exerciseGuidance: [
      'Progressive resistance training (3-4 times a week) to upregulate GLUT4 muscle receptors',
      'Low-intensity steady state (LISS) outdoor walking to calm the sympathetic nervous system',
      'Avoid chronic exhaustive HIIT every day which can spike cortisol and worsen symptoms',
    ],
    careChecklist: [
      { title: 'Cinnamon Herbal Tea & Morning Hydration', time: '10:30', note: 'Drink warm water with Ceylon cinnamon for glucose support' },
      { title: 'Evening Wind-Down & Sleep Prep', time: '21:45', note: 'Prepare dark cool room for 8 hours of restorative hormonal sleep' },
    ],
  },
  {
    id: 'asthma',
    name: 'Asthma & Respiratory Care',
    badge: 'Airway Safety & Warm-Up',
    summary:
      'A holistic respiratory protocol designed to prevent exercise-induced bronchospasms, maintain mucosal airway hydration, and minimize dietary inflammatory triggers.',
    dietRules: [
      'High dietary antioxidants: vitamin C rich oranges, bell peppers, kiwi, and berries',
      'Magnesium sources (spinach, pumpkin seeds) to support bronchial smooth muscle relaxation',
      'Drink warm or room-temperature liquids; avoid ice-cold drinks that may induce airway spasms',
    ],
    foodsToAvoid: [
      'Sulfites found in dried fruits, packaged wine, bottled lemon juice, and maraschino cherries',
      'Heavy, oversized dinners right before bed that promote gastroesophageal acid reflux (GERD)',
      'Artificial food coloring and ultra-processed sodium-heavy snacks',
    ],
    exerciseGuidance: [
      'ALWAYS keep your prescribed fast-acting rescue inhaler (Albuterol) within arm\'s reach',
      'Perform a mandatory gradual 10-15 minute warm-up before any cardiovascular activity',
      'Exercise in warm, humid indoor spaces during cold weather, or wear a scarf covering mouth',
      'Choose swimming, walking, cycling, or gymnastics with short bursts over continuous running in cold air',
    ],
    careChecklist: [
      { title: 'Morning Inhaler & Airway Pack Check', time: '07:45', note: 'Verify your rescue inhaler is in your daily bag and not expired' },
      { title: 'Evening Respiratory Comfort Check', time: '21:00', note: 'Log nighttime cough or wheeze symptoms to discuss with doctor' },
    ],
  },
  {
    id: 'arthritis',
    name: 'Arthritis & Joint Inflammation',
    badge: 'Zero-Impact Mobility',
    summary:
      'Combines an anti-inflammatory Mediterranean dietary profile with low-shear synovial fluid stimulation to relieve joint stiffness and preserve cartilage flexibility.',
    dietRules: [
      'Generous servings of polyphenol-rich dark cherries, blueberries, and blackberries',
      'Golden turmeric milk or tea paired with a pinch of black pepper for enhanced curcumin absorption',
      'Abundant extra virgin olive oil, wild salmon, mackerel, and ground flaxseeds',
      'Bone broth and collagen-rich soups with mineral vegetables',
    ],
    foodsToAvoid: [
      'Deep-fried foods and trans-fats that stimulate systemic inflammatory cytokines (TNF-alpha)',
      'Excessive refined cane sugar, high-fructose corn syrups, and corn oil',
      'Processed deli cold cuts with chemical nitrates',
    ],
    exerciseGuidance: [
      'Low-impact aquatic therapy, swimming, or water aerobics (water supports 90% of body weight)',
      'Smooth recumbent stationary bicycle with gentle pedal resistance',
      'Gentle isometric quadriceps and hamstring strengthening to support knee stabilization',
      'STRICTLY AVOID high-impact running on hard asphalt or abrupt jump training',
    ],
    careChecklist: [
      { title: 'Morning 5-Minute Bed Mobility Stretch', time: '07:15', note: 'Gentle ankle rolls and knee hugs before getting out of bed' },
      { title: 'Evening Warm Epsom Salt or Shower Soak', time: '20:45', note: 'Soothe joints and relieve evening stiffness' },
    ],
  },
  {
    id: 'kidney',
    name: 'Kidney Health (CKD Clinical Protocol)',
    badge: 'Physician Safeguarded',
    summary:
      'Healthify strictly enforces safety guardrails for renal conditions. Automated generic diet planning is blocked to prevent dangerous electrolyte imbalances (potassium, phosphorus, protein).',
    dietRules: [
      'Healthify routes all meal planning to direct consultation with your certified renal dietitian',
      'Dietary rules must be tailored strictly to current lab values (eGFR, serum creatinine, potassium)',
      'Strict caution against high-protein fads or over-the-counter sodium-based electrolyte powders',
    ],
    foodsToAvoid: [
      'High-potassium salt substitutes (potassium chloride "lite salt" can cause lethal arrhythmias)',
      'Phosphorus food additives (found in commercial dark sodas and processed cheeses)',
      'Unsupervised high-protein supplements, protein shakes, or creatine powders',
    ],
    exerciseGuidance: [
      'Requires explicit nephrologist authorization before starting structured programs',
      'Gentle seated arm and leg movements or short 10-15 minute flat indoor walks',
      'Carefully monitor fluid loss and avoid excessive sweating without clinical guidance',
    ],
    careChecklist: [
      { title: 'Morning Seated BP & Fluid Log', time: '08:00', note: 'Record blood pressure and check for ankle or facial puffiness' },
      { title: 'Clinical Renal Checkup Reminder', time: '12:00', note: 'Verify upcoming lab blood draw appointments with nephrologist' },
    ],
  },
  {
    id: 'heart',
    name: 'Cardiovascular & Heart Health',
    badge: 'Supervised Cardiac Wellness',
    summary:
      'Designed to reduce myocardial workload, safeguard against acute pressure spikes, and foster long-term vascular health under strict cardiologist supervision.',
    dietRules: [
      'Strict sodium restriction (<1,500mg/day) to prevent fluid retention and cardiac strain',
      'Cardioprotective omega-3 fatty acids from wild-caught cold water fish',
      'Nitrate-rich foods (beets, arugula, spinach) to support natural endothelial nitric oxide release',
      'Whole grain soluble fibers to prevent arterial plaque progression',
    ],
    foodsToAvoid: [
      'Salty cured charcuterie, canned broths, salty condiments, and frozen entrees',
      'Energy drinks, high-dose caffeine pre-workout powders, and weight-loss thermogenics',
      'Trans-fat margarines and deep-fried restaurant snacks',
    ],
    exerciseGuidance: [
      'Physician clearance required before initiating structured exercise programs',
      'Light to moderate continuous walking in monitored target heart rate zones (60-70% max HR)',
      'Strict avoidance of heavy weightlifting, straining, or abrupt competitive sprints',
      'Stop immediately if experiencing chest tightness, lightheadedness, or shortness of breath',
    ],
    careChecklist: [
      { title: 'Morning Pulse & Seated Blood Pressure', time: '08:00', note: 'Measure resting heart rate and blood pressure' },
      { title: 'Evening Symptom & Ankle Swelling Check', time: '20:00', note: 'Check ankles for edema or unusual fatigue symptoms' },
    ],
  },
  {
    id: 'anemia',
    name: 'Anemia & Iron Optimization',
    badge: 'Iron + Vitamin C Synergy',
    summary:
      'Focused on increasing hemoglobin synthesis and rebuilding ferritin stores by pairing bioavailable iron with ascorbic acid while removing nutrient absorption inhibitors.',
    dietRules: [
      'Pair non-heme plant iron (spinach, lentils, blackstrap molasses) with vitamin C (lemon, bell peppers)',
      'Incorporate heme iron sources (lean poultry, eggs, seafood) which absorb 2-3x more efficiently',
      'Cook acidic tomato dishes in a traditional cast-iron skillet to boost dietary iron content',
      'Eat vitamin B12 and folate rich foods: eggs, legumes, fortified nutritional yeast',
    ],
    foodsToAvoid: [
      'Drinking black tea, green tea, or coffee within 2 hours of iron-rich meals or iron supplements',
      'High-dose calcium tablets taken at the same moment as iron (calcium competes for absorption)',
      'Unprocessed wheat bran cereals consumed simultaneously with iron medication',
    ],
    exerciseGuidance: [
      'Low to moderate intensity walking with frequent rest breaks to honor tissue oxygenation',
      'Avoid high-intensity metabolic conditioning until hemoglobin stabilizes above clinical threshold',
      'Stay well-hydrated before, during, and after light walks to maintain plasma volume',
    ],
    careChecklist: [
      { title: 'Iron Supplement with Citrus Water', time: '10:00', note: 'Take prescribed iron with orange or lemon water for maximum absorption' },
      { title: 'Energy & Breath Monitoring', time: '15:00', note: 'Log any afternoon dizziness or shortness of breath on stairs' },
    ],
  },
  {
    id: 'obesity',
    name: 'Obesity & Metabolic Wellness',
    badge: 'Satiety & Joint-Friendly Pacing',
    summary:
      'Promotes sustainable body composition improvement through high satiety protein pacing, volume eating with non-starchy vegetables, and progressive low-joint-impact movement.',
    dietRules: [
      'Fill half of every plate with non-starchy vegetables (zucchini, cucumbers, leafy greens, peppers)',
      'Aim for 25-30g lean protein per meal to maintain metabolic muscle tissue and suppress hunger hormones',
      'Drink 3 liters of water daily; have 500ml before main meals',
      'Replace refined carbs with high-volume resistant starches and beans',
    ],
    foodsToAvoid: [
      'Liquid calories: sugary coffees, milkshakes, soda, fruit juice concentrates, and alcohol',
      'Ultra-processed snacking chips, cookies, and candy bars',
      'Excessive culinary oils and creamy mayonnaise dressings',
    ],
    exerciseGuidance: [
      'Joint-friendly low-impact walking: 20-30 minutes daily on flat grass or treadmill',
      'Water aerobics and lap swimming to relieve heavy stress on knee and hip joints',
      'Seated resistance bands and dumbbell presses to stimulate lean metabolic tissue',
      'Progressively increase daily steps by 500 steps every week',
    ],
    careChecklist: [
      { title: 'Morning Fasting Weight & Hydration Log', time: '07:30', note: 'Step on scale once weekly under consistent morning conditions' },
      { title: 'Daily 8,000 Step Progress Check', time: '18:00', note: 'Check step counter and take an evening neighborhood walk' },
    ],
  },
];

// Individual How It Works Step Definitions (each with its OWN distinct description)
interface HowItWorksStep {
  step: number;
  title: string;
  tag: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  details: string[];
  userAction: string;
}

const HOW_IT_WORKS_DATA: HowItWorksStep[] = [
  {
    step: 1,
    title: '60-Second Clinical Onboarding',
    tag: 'Profile Setup',
    icon: Sparkles,
    description:
      'Answer a few gentle questions about your age, biological gender, height, weight, daily activity level, food preferences (veg, vegan, eggetarian, non-veg), regional cuisines, and allergies. Select any diagnosed health conditions (Diabetes, Hypertension, Thyroid, PCOS, etc.) to immediately calibrate your clinical guardrails.',
    details: [
      'Select 1 or multiple diagnosed health conditions with zero complicated medical jargon',
      'Set dietary rules: allergies (peanuts, gluten, dairy) and cuisine choices',
      'Profiles can be updated at any time from your Account settings',
    ],
    userAction: 'Complete the simple 3-step setup right after creating your account.',
  },
  {
    step: 2,
    title: 'Add Medicines or Snap a Prescription',
    tag: 'Medication Intake',
    icon: Pill,
    description:
      'Build your personalized medicine schedule in seconds. Type in the medicine name, dosage, form, and clock times with meal rules (before food, after food, empty stomach). Or snap a photo of your doctor\'s prescription paper: Gemini Vision extracts the items, and you review each field before confirming.',
    details: [
      'Set exact reminder clock times (e.g. 08:00 AM, 02:00 PM, 08:30 PM)',
      'Assign meal dependencies and track your pill inventory counts',
      'Condition-based care checklists (blood pressure logs, glucose checks) add in 1 tap',
    ],
    userAction: 'Add your active medications or snap a prescription paper.',
  },
  {
    step: 3,
    title: 'AI Tailored Diet & Movement Generation',
    tag: 'Personalized Plans',
    icon: Utensils,
    description:
      'Healthify evaluates your clinical conditions and queries our built-in clinical knowledge base alongside Gemini to generate a tailored 7-day whole-food meal schedule and safe movement program. If you have multiple conditions (e.g. Diabetes + Hypertension), the app harmonizes low-sodium and low-GI rules.',
    details: [
      '5 distinct meals per day (breakfast, mid-morning, lunch, evening snack, dinner)',
      'Calorie rings, macro targets, 1-tap meal swapping, and weekly grocery lists',
      'Step-by-step guided workout player with rest countdowns and safe form tips',
    ],
    userAction: 'Click "Generate 7-Day Plan" on the Diet and Exercise tabs.',
  },
  {
    step: 4,
    title: 'Live Audio Chimes & 1-Tap Intake Logging',
    tag: 'Real-Time Reminders',
    icon: Clock,
    description:
      'When your scheduled dose time arrives, Healthify sounds a soothing dual-tone 528Hz harmonic chime and presents a clean in-app alarm and browser alert. Tap "Taken" to log intake and decrement your pill stock, "Snooze 10m" if occupied, or "Skip" with an optional note.',
    details: [
      'Calm audio chime prevents alarm fatigue and anxiety',
      'Pill stock counter automatically tracks inventory and warns when refills are needed',
      'Full intake history lets you audit every taken or missed dose over time',
    ],
    userAction: 'Hear the gentle chime and tap "Taken" right from your phone or laptop.',
  },
  {
    step: 5,
    title: 'Biometric Tracking & Adherence Streaks',
    tag: 'Insights & Health Teams',
    icon: HeartPulse,
    description:
      'Record your Blood Pressure, Blood Glucose, and Weight. Healthify categorizes readings with clinical badges from Normal to Critical, tracks your consecutive day adherence streak, and plots your weekly dose compliance bar chart. Take the clean report to your next physician visit.',
    details: [
      'Color-coded vitals readings with emergency red-flag safeguards for acute spikes',
      'Consecutive day streak counter celebrates your daily adherence habit',
      '7-day compliance percentage chart helps you visualize long-term consistency',
    ],
    userAction: 'Log daily vitals and celebrate keeping your adherence streak alive!',
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onForgotPassword }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const { success, error, info } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('register');

  // ONE UNIFIED SECTION on the page containing Features, Conditions, How It Works, and Contact
  const [unifiedTab, setUnifiedTab] = useState<'features' | 'conditions' | 'howItWorks' | 'contact'>('features');

  // Active selected item inside unified sections
  const [activeFeatureId, setActiveFeatureId] = useState<string>('medicine-reminders');
  const [activeConditionId, setActiveConditionId] = useState<string>('diabetes');
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);

  // Google sign in modal (triggered from login/auth section)
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Google quick sign in
  const [googleEmailInput, setGoogleEmailInput] = useState('chitranshitiwari1209@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Chitranshi Tiwari');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Question');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const [loading, setLoading] = useState(false);

  // Live validation calculations for register
  const isEmailValid = EMAIL_REGEX.test(registerEmail.trim());
  const hasMinLength = registerPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(registerPassword);
  const hasNumber = /\d/.test(registerPassword);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const doPasswordsMatch = registerPassword.length > 0 && registerPassword === confirmPassword;

  const navigateToUnifiedTab = (tab: 'features' | 'conditions' | 'howItWorks' | 'contact') => {
    setUnifiedTab(tab);
    document.getElementById('unified-guide-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStartedClick = () => {
    setMode('register');
    const authBox = document.getElementById('auth-box');
    if (authBox) {
      authBox.scrollIntoView({ behavior: 'smooth' });
      // Add a quick pulse highlight
      authBox.classList.add('ring-4', 'ring-emerald-500/30');
      setTimeout(() => {
        authBox.classList.remove('ring-4', 'ring-emerald-500/30');
      }, 1500);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !loginPassword) {
      error('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanEmail, loginPassword, rememberMe);
      if (res.success) {
        success('Welcome back to Healthify!');
      } else {
        error(res.message || 'Login failed. Please check your email and password.');
      }
    } catch (err: any) {
      error(err?.message || 'Login request failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = registerEmail.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      error('Please provide your full name (at least 2 characters).');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      error('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (registerPassword.length < 8) {
      error('Password must be at least 8 characters long.');
      return;
    }

    if (!/[a-zA-Z]/.test(registerPassword) || !/\d/.test(registerPassword)) {
      error('Password must contain both letters and numbers.');
      return;
    }

    if (!confirmPassword) {
      error('Please confirm your password.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      error('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(cleanName, cleanEmail, registerPassword, confirmPassword);
      if (res.success) {
        success('Account created! Welcome to your personalized wellness journey.');
      } else {
        error(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      error(err?.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (emailToUse?: string, nameToUse?: string) => {
    const finalEmail = (emailToUse || googleEmailInput || '').trim().toLowerCase();
    const finalName = (nameToUse || googleNameInput || finalEmail.split('@')[0] || 'User').trim();

    if (!finalEmail || !EMAIL_REGEX.test(finalEmail)) {
      error('Please enter a valid Google email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithGoogle({
        email: finalEmail,
        fullName: finalName,
      });
      if (res.success) {
        success(res.message || `Signed in with Google as ${finalEmail}`);
        setShowGoogleModal(false);
      } else {
        error(res.message || 'Google Sign-In failed');
      }
    } catch (err: any) {
      error(err?.message || 'Google Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = async (autoSubmit = false) => {
    setMode('login');
    setLoginEmail('demo@healthify.app');
    setLoginPassword('Demo@1234');
    success('Demo credentials loaded! Click Sign In to explore.');
    document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth' });

    if (autoSubmit) {
      setLoading(true);
      try {
        const res = await login('demo@healthify.app', 'Demo@1234', true);
        if (res.success) {
          success('Welcome back to Healthify!');
        } else {
          error(res.message || 'Demo login failed');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) {
      error('Please enter your email and message.');
      return;
    }
    setSendingContact(true);
    setTimeout(() => {
      setSendingContact(false);
      setContactMessage('');
      success('Thank you! Our care team has received your message and will respond shortly.');
    }, 600);
  };

  const currentActiveFeature = FEATURES_DATA.find(f => f.id === activeFeatureId) || FEATURES_DATA[0];
  const currentActiveCondition = CONDITIONS_DATA.find(c => c.id === activeConditionId) || CONDITIONS_DATA[0];
  const currentActiveStep = HOW_IT_WORKS_DATA.find(s => s.step === activeStepNumber) || HOW_IT_WORKS_DATA[0];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* TOP NAVIGATION BAR: Clean Typography Brand, Nav Links to unified section, ONLY 'Get Started' button */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand: Clean modern typography (No logo image) */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-2xl font-black text-slate-900 tracking-tight flex items-center hover:opacity-90 transition-opacity cursor-pointer select-none"
            >
              <span>Healthify</span>
              <span className="text-emerald-500 font-black">.</span>
            </button>

            {/* Desktop Navigation Links (Navigates directly to unified section tab) */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => navigateToUnifiedTab('features')}
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  unifiedTab === 'features' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700'
                }`}
              >
                Features
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('conditions')}
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  unifiedTab === 'conditions' ? 'text-teal-700 font-extrabold' : 'hover:text-teal-700'
                }`}
              >
                Conditions
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('howItWorks')}
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  unifiedTab === 'howItWorks' ? 'text-amber-700 font-extrabold' : 'hover:text-amber-700'
                }`}
              >
                How It Works
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('contact')}
                className={`transition-colors flex items-center gap-1 cursor-pointer py-1 ${
                  unifiedTab === 'contact' ? 'text-emerald-700 font-extrabold' : 'hover:text-emerald-700'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contact</span>
              </button>
            </nav>
          </div>

          {/* Top Right: ONLY 'Get Started' Button (Google sign-in and clutter removed as requested) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGetStartedClick}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-around text-xs font-bold text-slate-600">
        <button
          onClick={() => navigateToUnifiedTab('features')}
          className={`py-1 ${unifiedTab === 'features' ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600' : ''}`}
        >
          Features
        </button>
        <button
          onClick={() => navigateToUnifiedTab('conditions')}
          className={`py-1 ${unifiedTab === 'conditions' ? 'text-teal-700 font-extrabold border-b-2 border-teal-600' : ''}`}
        >
          Conditions
        </button>
        <button
          onClick={() => navigateToUnifiedTab('howItWorks')}
          className={`py-1 ${unifiedTab === 'howItWorks' ? 'text-amber-700 font-extrabold border-b-2 border-amber-600' : ''}`}
        >
          How It Works
        </button>
        <button
          onClick={() => navigateToUnifiedTab('contact')}
          className={`py-1 ${unifiedTab === 'contact' ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600' : ''}`}
        >
          Contact
        </button>
      </div>

      {/* HERO SECTION WITH AUTH CARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Trust Highlights, and Direct Explorer Shortcut */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Medicine Reminders & Personalized Wellness</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Take control of your health with{' '}
              <span className="text-emerald-600">personalized care.</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Strict doctor-aligned medication timelines, real-time audio chime reminders, prescription scanning, and condition-adapted nutrition & workout routines for Diabetes, Hypertension, Thyroid, PCOS, and more.
            </p>

            {/* Quick Unified Section Shortcuts (Click to navigate straight to that tab in the unified section) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigateToUnifiedTab('features')}
                className={`p-3 rounded-2xl bg-white border text-left transition-all hover:shadow-xs group cursor-pointer ${
                  unifiedTab === 'features' ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-slate-200/80 hover:border-emerald-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors w-fit mb-1.5">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  Features
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Alarms & scanner
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('conditions')}
                className={`p-3 rounded-2xl bg-white border text-left transition-all hover:shadow-xs group cursor-pointer ${
                  unifiedTab === 'conditions' ? 'border-teal-500 ring-2 ring-teal-500/15' : 'border-slate-200/80 hover:border-teal-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors w-fit mb-1.5">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                  Conditions
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  11 protocols
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('howItWorks')}
                className={`p-3 rounded-2xl bg-white border text-left transition-all hover:shadow-xs group cursor-pointer ${
                  unifiedTab === 'howItWorks' ? 'border-amber-500 ring-2 ring-amber-500/15' : 'border-slate-200/80 hover:border-amber-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors w-fit mb-1.5">
                  <ListChecks className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  How It Works
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  5 simple steps
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigateToUnifiedTab('contact')}
                className={`p-3 rounded-2xl bg-white border text-left transition-all hover:shadow-xs group cursor-pointer ${
                  unifiedTab === 'contact' ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-slate-200/80 hover:border-emerald-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors w-fit mb-1.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  Contact
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Help & helpline
                </p>
              </button>
            </div>

            {/* Adherence trust note */}
            <div className="pt-1 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
                  AM
                </div>
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
                  CT
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
                  +9k
                </div>
              </div>
              <span>
                <strong className="text-slate-800 font-bold">94% on-time dose adherence</strong> achieved by active members.
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Card (Where Google Auth, Create Account & Login Live) */}
          <div id="auth-box" className="lg:col-span-5 w-full transition-all duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/90 space-y-5">
              {/* Mode switch tabs: Create Account & Sign In */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* GOOGLE AUTH (Works on 1st click, with account switch option) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleAuth('chitranshitiwari1209@gmail.com', 'Chitranshi Tiwari')}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleGIcon />
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                  <span className="truncate">Google: <strong className="text-slate-800 font-semibold">chitranshitiwari1209@gmail.com</strong></span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    Switch account
                  </button>
                </div>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-3 text-slate-400 font-bold">
                      Or with email password
                    </span>
                  </div>
                </div>
              </div>

              {/* CREATE ACCOUNT FORM (Default for Get Started) */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                        registerEmail && !isEmailValid
                          ? 'border-rose-300 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {registerEmail && !isEmailValid && (
                      <p className="text-[11px] text-rose-500 mt-1">Please enter a valid email format (e.g. name@example.com)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 8 chars with letter & number"
                        value={registerPassword}
                        onChange={e => setRegisterPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live indicators */}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                      <span className={`flex items-center gap-1 font-semibold ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {hasMinLength ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                        8+ chars
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${hasLetter ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {hasLetter ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                        1 letter
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                        1 number
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                        confirmPassword && !doPasswordsMatch
                          ? 'border-rose-300 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {confirmPassword && !doPasswordsMatch && (
                      <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                    )}
                    {doPasswordsMatch && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-50 mt-1 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 pr-11 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-medium text-slate-600">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => fillDemoAccount(false)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ONE UNIFIED SECTION: Features, Conditions, How It Works, and Contact together */}
      <section id="unified-guide-section" className="w-full bg-white border-t border-slate-200/80 py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Healthify Wellness & Clinical Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Features, Conditions, How It Works & Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Click any category tab below to explore distinct descriptions, clinical diet & workout rules, or reach out to our care team.
            </p>
          </div>

          {/* ALL 4 PILL TABS IN ONE CONSOLIDATED CONTROL */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl gap-1 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setUnifiedTab('features')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  unifiedTab === 'features'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Features (6 Tools)
              </button>

              <button
                type="button"
                onClick={() => setUnifiedTab('conditions')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  unifiedTab === 'conditions'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Conditions (11 Protocols)
              </button>

              <button
                type="button"
                onClick={() => setUnifiedTab('howItWorks')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  unifiedTab === 'howItWorks'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                How It Works (5 Steps)
              </button>

              <button
                type="button"
                onClick={() => setUnifiedTab('contact')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  unifiedTab === 'contact'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contact & Support</span>
              </button>
            </div>
          </div>

          {/* 1. FEATURES TAB */}
          {unifiedTab === 'features' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Clickable Feature Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {FEATURES_DATA.map(f => {
                  const Icon = f.icon;
                  const isSelected = activeFeatureId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFeatureId(f.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl text-white ${isSelected ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-200/60 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                          {f.tag}
                        </span>
                      </div>
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Feature Detail Card - Displays distinct description */}
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/40 border border-emerald-100 shadow-sm space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm">
                      <currentActiveFeature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{currentActiveFeature.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {currentActiveFeature.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{currentActiveFeature.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetStartedClick}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Try Feature with Free Account
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Comprehensive Description & Clinical Rationale
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentActiveFeature.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Key Technical & Clinical Capabilities</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentActiveFeature.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Patient Best Practice Tip</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentActiveFeature.patientTip}
                    </p>
                    <div className="pt-2 text-[11px] text-slate-400 italic">
                      "Always follow your doctor's exact prescription and consultation directions."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CONDITIONS TAB */}
          {unifiedTab === 'conditions' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Clickable Condition Pills (11 Conditions) */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {CONDITIONS_DATA.map(c => {
                  const isSelected = activeConditionId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveConditionId(c.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c.name.split('(')[0].trim()}
                    </button>
                  );
                })}
              </div>

              {/* Active Condition Detail Card - Displays distinct description */}
              <div className="p-6 sm:p-8 rounded-3xl bg-teal-50/40 border border-teal-100 shadow-sm space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{currentActiveCondition.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                        {currentActiveCondition.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {currentActiveCondition.summary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetStartedClick}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Select Condition & Get Started
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Food to Include */}
                  <div className="p-4 rounded-2xl bg-white border border-teal-100 space-y-2">
                    <span className="font-bold text-emerald-800 block uppercase text-[10px] tracking-wider">
                      Foods To Include & Prioritize
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentActiveCondition.dietRules.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Foods to Limit / Avoid */}
                  <div className="p-4 rounded-2xl bg-white border border-teal-100 space-y-2">
                    <span className="font-bold text-rose-800 block uppercase text-[10px] tracking-wider">
                      Foods Strictly Limited or Avoided
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentActiveCondition.foodsToAvoid.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Safe Movement & Care Checklist */}
                  <div className="p-4 rounded-2xl bg-white border border-teal-100 space-y-3">
                    <div>
                      <span className="font-bold text-teal-800 block uppercase text-[10px] tracking-wider mb-1">
                        Safe Movement Guidelines
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {currentActiveCondition.exerciseGuidance.map((e, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-amber-800 block uppercase text-[10px] tracking-wider mb-1">
                        Daily Care Checklist Reminders
                      </span>
                      <div className="space-y-1.5">
                        {currentActiveCondition.careChecklist.map((item, i) => (
                          <div key={i} className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px]">
                            <div className="flex items-center justify-between font-bold text-amber-950">
                              <span>{item.title}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-amber-700 border border-amber-200">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-900 mt-0.5">{item.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HOW IT WORKS TAB */}
          {unifiedTab === 'howItWorks' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Clickable Step Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {HOW_IT_WORKS_DATA.map(s => {
                  const isSelected = activeStepNumber === s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStepNumber(s.step)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                          isSelected ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                          {s.step}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          {s.tag}
                        </span>
                      </div>
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Detail Card - Displays distinct description */}
              <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/40 border border-amber-100 shadow-sm space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-xs">
                      {currentActiveStep.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{currentActiveStep.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {currentActiveStep.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Step {currentActiveStep.step} in your Healthify routine</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetStartedClick}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Start Step 1: Create Account
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Step Description & What Happens
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentActiveStep.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-amber-600" />
                      <span>What You Experience at This Step</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentActiveStep.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Patient Action Required</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentActiveStep.userAction}
                    </p>
                    <div className="pt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Zero complex medical math or confusing setup needed.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CONTACT & SUPPORT TAB (Unified in same section) */}
          {unifiedTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/40 border border-emerald-100 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Healthify Care Support & Helpline</h3>
                      <p className="text-xs text-slate-500">
                        Our clinical and technical support team is available to assist you with medication reminders, nutrition plans, or account management.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Contact Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span>Email Support</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">support@healthify.app</p>
                    <p className="text-[11px] text-slate-500">Average response in 2-4 hours</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-teal-100 space-y-1">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                      <Phone className="w-4 h-4 text-teal-600" />
                      <span>Toll-Free Helpline</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">+1 (800) 432-5844</p>
                    <p className="text-[11px] text-slate-500">Mon - Fri, 8:00 AM - 8:00 PM EST</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Emergency Protocol</span>
                    </div>
                    <p className="text-xs font-bold text-amber-950">Immediate Dial: 911 / EMS</p>
                    <p className="text-[11px] text-amber-900">For acute chest pain, severe shortness of breath or trauma</p>
                  </div>
                </div>

                {/* Contact Message Form */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Send a Direct Message to Care Support</span>
                  </h4>

                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Alex Morgan"
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Email</label>
                        <input
                          type="email"
                          required
                          placeholder="alex@example.com"
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Topic</label>
                      <select
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                      >
                        <option value="Medicine Reminder Help">Medicine Reminder Help</option>
                        <option value="Diet & Nutrition Question">Diet & Nutrition Question</option>
                        <option value="Exercise Plan Question">Exercise Plan Question</option>
                        <option value="Account or Login Issue">Account or Login Issue</option>
                        <option value="General Feedback">General Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Please describe how we can assist you..."
                        value={contactMessage}
                        onChange={e => setContactMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={sendingContact}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingContact ? 'Sending Message...' : 'Submit Message'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER: Typography Brand, Quick Links, Emergency Dial */}
      <footer className="bg-white border-t border-slate-200/80 px-4 sm:px-8 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-lg font-black text-slate-900 tracking-tight">
              Healthify<span className="text-emerald-500">.</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-500">
              Doctor-aligned medicine reminders, DASH/Low-GI nutrition & safe workouts.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <button
              onClick={() => navigateToUnifiedTab('features')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => navigateToUnifiedTab('conditions')}
              className="hover:text-teal-700 transition-colors cursor-pointer"
            >
              Conditions
            </button>
            <button
              onClick={() => navigateToUnifiedTab('howItWorks')}
              className="hover:text-amber-700 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => navigateToUnifiedTab('contact')}
              className="hover:text-emerald-700 transition-colors cursor-pointer text-slate-700 font-bold"
            >
              Contact Support
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600 font-bold">Emergency Dial: 911 / EMS</span>
          </div>
        </div>
      </footer>

      {/* GOOGLE AUTH MODAL DIALOG (Opened when clicking Continue with Google in the login/auth card) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <GoogleGIcon />
                <h3 className="text-base font-bold text-slate-900">Sign in with Google</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select or confirm your Google account to sign in or create your Healthify profile:
            </p>

            {/* Quick 1-click option for user email */}
            <div
              onClick={() => handleGoogleAuth('chitranshitiwari1209@gmail.com', 'Chitranshi Tiwari')}
              className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  CT
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                    Chitranshi Tiwari
                  </h4>
                  <p className="text-[11px] text-slate-500">chitranshitiwari1209@gmail.com</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                Continue
              </span>
            </div>

            {/* Custom Google account entry */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Or use another Google account:</span>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Email</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={e => setGoogleEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={e => setGoogleNameInput(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGoogleAuth()}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In with Google'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
