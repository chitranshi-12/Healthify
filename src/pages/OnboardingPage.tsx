import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Heart,
  Scale,
  Utensils,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface OnboardingPageProps {
  onComplete: () => void;
}

const CONDITIONS_LIST = [
  { id: 'diabetes', label: 'Diabetes / Prediabetes', category: 'Metabolic' },
  { id: 'hypertension', label: 'Hypertension (High BP)', category: 'Cardiovascular' },
  { id: 'high cholesterol', label: 'High Cholesterol', category: 'Cardiovascular' },
  { id: 'thyroid', label: 'Thyroid Conditions', category: 'Endocrine' },
  { id: 'pcos', label: 'PCOS', category: 'Hormonal' },
  { id: 'asthma', label: 'Asthma / Respiratory', category: 'Respiratory' },
  { id: 'heart disease', label: 'Heart Disease', category: 'Cardiovascular', warn: true },
  { id: 'arthritis', label: 'Arthritis / Joint Pain', category: 'Musculoskeletal' },
  { id: 'obesity', label: 'Weight Management', category: 'Metabolic' },
  { id: 'anemia', label: 'Iron Deficiency / Anemia', category: 'Nutritional' },
  { id: 'kidney issues', label: 'Kidney Health (CKD)', category: 'Renal', warn: true },
  { id: 'none', label: 'None / General Wellness', category: 'Preventive' },
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { updateUserOnboarding } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [age, setAge] = useState<number | ''>(32);
  const [gender, setGender] = useState('female');
  const [heightCm, setHeightCm] = useState<number | ''>(168);
  const [weightKg, setWeightKg] = useState<number | ''>(68);
  const [activityLevel, setActivityLevel] = useState('moderate');

  const [foodPreference, setFoodPreference] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('Mediterranean & Global');
  const [foodAllergies, setFoodAllergies] = useState('None');
  const [goal, setGoal] = useState('manage condition');

  const [selectedConditions, setSelectedConditions] = useState<string[]>(['hypertension']);

  const toggleCondition = (condId: string) => {
    if (condId === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    setSelectedConditions(prev => {
      const filtered = prev.filter(c => c !== 'none');
      if (filtered.includes(condId)) {
        return filtered.filter(c => c !== condId);
      } else {
        return [...filtered, condId];
      }
    });
  };

  const handleFinish = async () => {
    if (selectedConditions.length === 0) {
      error('Please select at least one condition or "None".');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitOnboarding({
        age: Number(age) || null,
        gender,
        height_cm: Number(heightCm) || null,
        weight_kg: Number(weightKg) || null,
        activity_level: activityLevel,
        food_preference: foodPreference,
        cuisine,
        food_allergies: foodAllergies,
        goal,
        conditions: selectedConditions,
      });

      if (res.success) {
        updateUserOnboarding(true);
        success('Health profile created! Welcome to your Healthify dashboard.');
        onComplete();
      } else {
        error(res.message || 'Failed to complete onboarding');
      }
    } catch (err) {
      error('An error occurred during onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/5 border border-emerald-100">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Healthify<span className="text-emerald-500">.</span>
            </h1>
            <p className="text-xs text-slate-400">Step {step} of 3 • Health Profile</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Skip to Dashboard &rarr;
            </button>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-2.5 rounded-full transition-all ${
                    s === step
                      ? 'w-8 bg-emerald-600'
                      : s < step
                      ? 'w-4 bg-emerald-300'
                      : 'w-4 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: Biometrics & Activity */}
        {step === 1 && (
          <div className="py-6 space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Basic Profile</h3>
              <p className="text-xs text-slate-500">Helps calibrate calorie, hydration, and safe workout limits.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={age}
                  onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="250"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Daily Activity Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, light walking' },
                  { id: 'light', label: 'Light', desc: '1-2 light workouts/wk' },
                  { id: 'moderate', label: 'Moderate', desc: '3-4 active days/wk' },
                  { id: 'high', label: 'Active', desc: 'Daily exercise / sport' },
                ].map(act => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivityLevel(act.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activityLevel === act.id
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">{act.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{act.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <span>Next: Nutrition Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Nutrition, Cuisine & Goal */}
        {step === 2 && (
          <div className="py-6 space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Nutrition & Dietary Preferences</h3>
              <p className="text-xs text-slate-500">We adapt meal plans to your cultural palate and restrictions.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Food Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'non-vegetarian', label: 'Non-Vegetarian' },
                  { id: 'vegan', label: 'Vegan' },
                  { id: 'eggetarian', label: 'Eggetarian' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFoodPreference(p.id)}
                    className={`py-3 px-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                      foodPreference === p.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cuisine / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Mediterranean, Indian, East Asian, American"
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Allergies / Dislikes</label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Shellfish, Gluten, None"
                  value={foodAllergies}
                  onChange={e => setFoodAllergies(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Primary Wellness Goal</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'manage condition', label: 'Manage Health Condition' },
                  { id: 'stay fit', label: 'Stay Healthy & Fit' },
                  { id: 'lose weight', label: 'Healthy Weight Loss' },
                  { id: 'gain weight', label: 'Lean Mass Gain' },
                ].map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                      goal === g.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <span>Next: Health Conditions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Health Conditions Selection */}
        {step === 3 && (
          <div className="py-6 space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Health Conditions</h3>
              <p className="text-xs text-slate-500">
                Select any diagnosed conditions. We tailor medicine care checklists, meal rules (DASH, Low GI), and safe workout limits accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
              {CONDITIONS_LIST.map(cond => {
                const isSelected = selectedConditions.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => toggleCondition(cond.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{cond.label}</span>
                        {cond.warn && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                            Care Alert
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{cond.category}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Medical Safety Note:</span> Reminders and lifestyle suggestions follow clinical evidence and doctor prescriptions. Healthify does not prescribe or change medical dosages.
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>Generating Health Profile...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
