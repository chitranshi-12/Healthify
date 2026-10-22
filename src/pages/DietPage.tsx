import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Sparkles,
  RotateCcw,
  ShoppingCart,
  Check,
  AlertTriangle,
  HeartPulse,
  Droplet,
  ChevronRight,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { DietPlan, DietDay, Meal } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { EmergencyBanner } from '../components/EmergencyBanner.js';
import { ProgressRing } from '../components/ProgressRing.js';

export const DietPage: React.FC = () => {
  const { success, error, info } = useToast();

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'meals' | 'grocery' | 'rules'>('meals');
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [checkedGroceries, setCheckedGroceries] = useState<Record<string, boolean>>({});
  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);

  const fetchDiet = async () => {
    try {
      const res = await api.getCurrentDiet();
      if (res.success && res.data) {
        setDietPlan(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generateDiet();
      if (res.success && res.data) {
        setDietPlan(res.data);
        success('Personalized diet plan regenerated with clinical adaptations!');
      } else {
        error(res.message || 'Failed to regenerate diet plan');
      }
    } catch (e) {
      error('Error regenerating diet plan');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSwapMeal = async (dayName: string, mealType: string) => {
    const key = `${dayName}-${mealType}`;
    setSwappingMeal(key);
    try {
      const res = await api.swapMeal(dayName, mealType);
      if (res.success && res.data?.updatedMeal) {
        success(`Swapped ${mealType}!`);
        await fetchDiet();
      } else {
        error('Failed to swap meal');
      }
    } catch (e) {
      error('Error swapping meal');
    } finally {
      setSwappingMeal(null);
    }
  };

  const toggleMealCheck = (day: string, type: string) => {
    const key = `${day}-${type}`;
    setCheckedMeals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroceryItem = (item: string) => {
    setCheckedGroceries(prev => ({ ...prev, [item]: !prev[item] }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  // Handle clinical block (e.g. kidney condition requiring clinical dietitian)
  if (dietPlan?.isBlocked) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-24">
        <EmergencyBanner doctorClearanceRequired={true} />
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-amber-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Clinical Oversight Required</h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {dietPlan.blockedMessage || 'Because renal conditions require precise titration of potassium, phosphorus, and electrolytes, please consult your nephrologist or registered renal dietitian for a clinical nutrition plan.'}
          </p>
          <div className="p-4 bg-amber-50 rounded-2xl max-w-md mx-auto text-xs text-amber-900 font-medium">
            Always strictly follow your physician's personalized nutrition orders and laboratory target ranges.
          </div>
        </div>
      </div>
    );
  }

  const days = dietPlan?.days || [];
  const currentDay: DietDay | undefined = days[selectedDayIndex] || days[0];

  const targetCalories = dietPlan?.target_calories || 1800;
  const targetProtein = dietPlan?.target_protein || 85;
  const targetCarbs = dietPlan?.target_carbs || 210;
  const targetFat = dietPlan?.target_fat || 55;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Emergency & Doctor Clearance */}
      <EmergencyBanner doctorClearanceRequired={dietPlan?.doctorClearanceRequired} />

      {/* Header & Regenerate action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Clinical Nutrition
            </span>
            <span className="text-xs text-slate-400">• 7-Day Plan</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {dietPlan?.title || 'Personalized Healthify Meal Plan'}
          </h2>
          <p className="text-xs text-slate-500">
            {dietPlan?.safetyDisclaimer || 'This is general guidance, not medical advice. Check with your doctor before starting.'}
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          <span>{regenerating ? 'Regenerating AI Plan...' : 'Regenerate Plan'}</span>
        </button>
      </div>

      {/* Daily Nutrition Target Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Target Calories</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{targetCalories} kcal</div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Protein</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{targetProtein}g</div>
          </div>
          <div className="p-2 rounded-xl bg-teal-100 text-teal-700 font-bold text-xs">Pro</div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Complex Carbs</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{targetCarbs}g</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs">Carb</div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Water Goal</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{dietPlan?.daily_water_goal_liters || 2.7}L</div>
          </div>
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
            <Droplet className="w-4 h-4 fill-sky-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('meals')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'meals' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Daily Meals Checklist
          {activeTab === 'meals' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('grocery')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'grocery' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Weekly Grocery List</span>
          {activeTab === 'grocery' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'rules' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Condition Dietary Guidelines
          {activeTab === 'rules' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: MEALS */}
      {activeTab === 'meals' && (
        <div className="space-y-6">
          {/* Day of Week Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {days.map((d, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.day}
                </button>
              );
            })}
          </div>

          {/* Meals for Selected Day */}
          {currentDay && (
            <div className="space-y-4">
              {[
                { type: 'breakfast', label: 'Breakfast', meal: currentDay.breakfast },
                { type: 'midMorningSnack', label: 'Mid-Morning Snack', meal: currentDay.midMorningSnack },
                { type: 'lunch', label: 'Lunch', meal: currentDay.lunch },
                { type: 'eveningSnack', label: 'Evening Snack', meal: currentDay.eveningSnack },
                { type: 'dinner', label: 'Dinner', meal: currentDay.dinner },
              ].map(({ type, label, meal }) => {
                if (!meal) return null;
                const checkKey = `${currentDay.day}-${type}`;
                const isChecked = !!checkedMeals[checkKey];
                const isSwapping = swappingMeal === checkKey;

                return (
                  <div
                    key={type}
                    className={`p-5 rounded-3xl border transition-all ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => toggleMealCheck(currentDay.day, type)}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-emerald-500'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {label}
                            </span>
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {meal.calories} kcal
                            </span>
                          </div>

                          <h4 className={`text-base font-bold text-slate-900 ${isChecked ? 'line-through text-slate-400' : ''}`}>
                            {meal.name}
                          </h4>

                          <p className="text-xs text-slate-500">
                            Portion: <span className="font-medium text-slate-700">{meal.portion}</span>
                            {meal.protein_g && ` • ${meal.protein_g}g Pro • ${meal.carbs_g}g Carb • ${meal.fat_g}g Fat`}
                          </p>

                          {meal.reason && (
                            <p className="text-xs text-emerald-700 bg-emerald-50/60 p-2 rounded-xl mt-1.5 inline-block">
                              <span className="font-bold">Why it’s here: </span>
                              {meal.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Swap button */}
                      <button
                        onClick={() => handleSwapMeal(currentDay.day, type)}
                        disabled={isSwapping}
                        className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                        <span>{isSwapping ? 'Swapping...' : 'Swap Meal'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROCERY LIST */}
      {activeTab === 'grocery' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>All ingredients needed to execute your 7-day personalized wellness meal plan.</span>
            <span className="font-bold text-slate-800">
              {Object.values(checkedGroceries).filter(Boolean).length} items checked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietPlan?.groceryList?.map((cat, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>{cat.category}</span>
                  <span className="text-xs font-normal text-slate-400">{cat.items.length} items</span>
                </h4>

                <div className="space-y-2">
                  {cat.items.map((item, iIdx) => {
                    const isChecked = !!checkedGroceries[item];
                    return (
                      <div
                        key={iIdx}
                        onClick={() => toggleGroceryItem(item)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                          isChecked ? 'bg-slate-50 opacity-60' : 'hover:bg-emerald-50/50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`text-xs font-medium text-slate-700 ${isChecked ? 'line-through' : ''}`}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONDITION DIETARY GUIDELINES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Clinical Reasoning Behind Your Plan</h3>
            <div className="space-y-2.5">
              {dietPlan?.conditionReasons?.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Medical Notice:</span>
              <p>
                Meal plans provide nutritional guidance aligned with clinical consensus (such as DASH diet for hypertension, low glycemic index for diabetes, and high soluble fiber for dyslipidemia). Always follow individual clinical prescriptions and consult your healthcare team for medication adjustments.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
