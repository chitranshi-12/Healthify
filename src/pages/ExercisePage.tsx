import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  Clock,
  Flame,
  AlertTriangle,
  HeartPulse,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ExercisePlan, ExerciseDay, ExerciseItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { EmergencyBanner } from '../components/EmergencyBanner.js';

interface ExercisePageProps {
  onStartWorkout: (day: ExerciseDay) => void;
}

export const ExercisePage: React.FC<ExercisePageProps> = ({ onStartWorkout }) => {
  const { success, error } = useToast();

  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any>(null);

  // Customization options for regenerate
  const [timeAvailable, setTimeAvailable] = useState(30);
  const [equipment, setEquipment] = useState('Bodyweight / Home');

  const fetchExercise = async () => {
    try {
      const [planRes, histRes] = await Promise.all([
        api.getCurrentExercise(),
        api.getWorkoutHistory(),
      ]);

      if (planRes.success && planRes.data) {
        setExercisePlan(planRes.data);
      }
      if (histRes.success && histRes.data) {
        setWorkoutHistory(histRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generateExercise({
        timeAvailableMins: timeAvailable,
        equipment,
      });
      if (res.success && res.data) {
        setExercisePlan(res.data);
        success('Personalized weekly fitness plan regenerated!');
      } else {
        error(res.message || 'Failed to regenerate workout plan');
      }
    } catch (e) {
      error('Error regenerating workout plan');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  const days = exercisePlan?.days || [];
  const currentDay: ExerciseDay | undefined = days[selectedDayIndex] || days[0];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Emergency & Doctor Clearance */}
      <EmergencyBanner doctorClearanceRequired={exercisePlan?.doctorClearanceRequired} />

      {/* Header & Regenerate action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Adaptive Fitness
            </span>
            <span className="text-xs text-slate-400">• Goal: {exercisePlan?.goal || 'Stay Fit'}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {exercisePlan?.title || 'Condition-Adapted Fitness Routine'}
          </h2>
          <p className="text-xs text-slate-500">
            {exercisePlan?.safetyDisclaimer || 'This is general guidance, not medical advice. Check with your doctor before starting.'}
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          <span>{regenerating ? 'Regenerating AI Workouts...' : 'Regenerate Workouts'}</span>
        </button>
      </div>

      {/* Fitness History Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Workouts Completed</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {workoutHistory?.totalWorkouts || 0} Sessions
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Active Minutes</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {workoutHistory?.totalMinutes || 0} Mins
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Calories Burned</span>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              ~{workoutHistory?.totalCalories || 0} kcal
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((d, idx) => {
          const isSelected = idx === selectedDayIndex;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {d.day} ({d.type})
            </button>
          );
        })}
      </div>

      {/* Selected Day Routine Card */}
      {currentDay && (
        <div className="space-y-6">
          {/* Day Hero Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-50 via-emerald-50 to-white border border-teal-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {currentDay.day} • {currentDay.type}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">{currentDay.title}</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {currentDay.cautions || 'Keep hydration steady and respect your comfortable joint range.'}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  {currentDay.estimated_duration_mins} Minutes
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  ~{currentDay.estimated_calories} kcal burned
                </span>
              </div>
            </div>

            <button
              onClick={() => onStartWorkout(currentDay)}
              className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/25 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Workout Player</span>
            </button>
          </div>

          {/* Warmup Section */}
          {currentDay.warmup && currentDay.warmup.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Gradual Warm-Up (5 Mins)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentDay.warmup.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white text-xs">
                    <span className="font-semibold text-slate-800">{w.name}</span>
                    <span className="text-slate-500 font-medium">{w.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Workout Exercises List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Exercises ({currentDay.exercises?.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDay.exercises?.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-base font-bold text-slate-900 leading-snug">
                        {idx + 1}. {ex.name}
                      </h5>
                      <div className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold shrink-0">
                        {ex.sets} &times; {ex.reps}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">
                      Rest Between Sets: <strong className="text-slate-700">{ex.rest}</strong>
                    </p>

                    {/* How-To */}
                    <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">How-To:</span>
                      <p className="leading-relaxed">{ex.howTo}</p>
                    </div>

                    {/* Common mistake & easier option */}
                    {ex.commonMistake && (
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900">
                        <span className="font-bold">Avoid: </span>
                        {ex.commonMistake}
                      </div>
                    )}

                    {ex.easierOption && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                        <span className="font-bold">Easier Option: </span>
                        {ex.easierOption}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown Section */}
          {currentDay.cooldown && currentDay.cooldown.length > 0 && (
            <div className="p-4 rounded-3xl bg-teal-50/50 border border-teal-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Cool-Down & Recovery Breathing (5 Mins)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentDay.cooldown.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white text-xs">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-500 font-medium">{c.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
