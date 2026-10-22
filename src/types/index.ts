export interface User {
  id: number;
  email: string;
  fullName: string;
  onboardingCompleted: boolean;
}

export interface Profile {
  id?: number;
  user_id?: number;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string;
  food_preference?: string;
  cuisine?: string;
  food_allergies?: string;
  goal?: string;
  onboarding_completed?: number;
  daily_water_glasses?: number;
  water_updated_date?: string;
}

export interface Medicine {
  id: number;
  name: string;
  dose: string;
  form: string;
  frequency_per_day: number;
  times_of_day: string[];
  meal_timing: string;
  days_of_week: string[] | string;
  start_date?: string;
  end_date?: string;
  stock_quantity: number;
  notes?: string;
  is_low_stock?: boolean;
}

export interface ScheduleItem {
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
}

export interface Meal {
  name: string;
  portion: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  reason?: string;
}

export interface DietDay {
  day: string;
  breakfast: Meal;
  midMorningSnack: Meal;
  lunch: Meal;
  eveningSnack: Meal;
  dinner: Meal;
}

export interface GroceryCategory {
  category: string;
  items: string[];
}

export interface DietPlan {
  id?: number;
  title: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  daily_water_goal_liters: number;
  days: DietDay[];
  groceryList: GroceryCategory[];
  conditionReasons: string[];
  isBlocked?: boolean;
  blockedMessage?: string;
  doctorClearanceRequired?: boolean;
  safetyDisclaimer?: string;
}

export interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  howTo: string;
  commonMistake: string;
  easierOption: string;
}

export interface ExerciseDay {
  day: string;
  title: string;
  type: string;
  estimated_duration_mins: number;
  estimated_calories: number;
  cautions?: string;
  warmup: Array<{ name: string; duration: string }>;
  exercises: ExerciseItem[];
  cooldown: Array<{ name: string; duration: string }>;
}

export interface ExercisePlan {
  id?: number;
  title: string;
  goal: string;
  fitness_level: string;
  days: ExerciseDay[];
  doctorClearanceRequired?: boolean;
  safetyDisclaimer?: string;
}

export interface VitalRecord {
  id: number;
  type: 'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate';
  value_primary: number;
  value_secondary?: number | null;
  unit: string;
  recorded_at: string;
  notes?: string;
  status_flag: 'normal' | 'elevated' | 'high' | 'critical' | 'low';
}

export interface DashboardSummary {
  userName: string;
  dayOfWeek: string;
  date: string;
  medicineProgress: {
    total: number;
    taken: number;
    percentage: number;
    allCompleted: boolean;
  };
  nextUpcomingDose: {
    type: string;
    name: string;
    dose?: string;
    time: string;
    mealTiming?: string;
    stockQuantity?: number;
  } | null;
  streak: number;
  dailyWater: {
    glasses: number;
    targetGlasses: number;
    liters: number;
  };
  todayMeals: DietDay | null;
  todayWorkout: ExerciseDay | null;
  dailyTip: {
    title: string;
    text: string;
    category: string;
  };
  conditions: string[];
  lowStockCount: number;
}
