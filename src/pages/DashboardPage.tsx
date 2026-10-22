import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  Flame,
  Droplet,
  Utensils,
  Activity,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { DashboardSummary } from '../types/index.js';
import { api } from '../services/api.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { EmergencyBanner } from '../components/EmergencyBanner.js';
import { useToast } from '../context/ToastContext.js';
import confetti from 'canvas-confetti';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddMedicine: () => void;
  onOpenVitalModal: () => void;
  onStartWorkout: (workout: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onOpenAddMedicine,
  onOpenVitalModal,
  onStartWorkout,
}) => {
  const { success, error } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterUpdating, setWaterUpdating] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleWaterAction = async (action: 'increment' | 'decrement') => {
    if (!summary || waterUpdating) return;
    setWaterUpdating(true);
    try {
      const res = await api.updateWater(action, 1);
      if (res.success && res.data) {
        setSummary(prev =>
          prev
            ? {
                ...prev,
                dailyWater: {
                  ...prev.dailyWater,
                  glasses: res.data.glasses,
                  liters: res.data.liters,
                },
              }
            : null
        );
        if (action === 'increment' && res.data.glasses === summary.dailyWater.targetGlasses) {
          confetti({ particleCount: 50, spread: 50 });
          success('Hydration goal achieved for today! 2.0 Liters!');
        }
      }
    } catch (e) {
      error('Failed to update water intake');
    } finally {
      setWaterUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200/70 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200/70 rounded-3xl" />
          <div className="h-64 bg-slate-200/70 rounded-3xl" />
          <div className="h-64 bg-slate-200/70 rounded-3xl" />
        </div>
      </div>
    );
  }

  const medProgress = summary?.medicineProgress || { total: 0, taken: 0, percentage: 100, allCompleted: false };
  const waterProgress = summary?.dailyWater || { glasses: 0, targetGlasses: 8, liters: 0 };
  const waterPercent = Math.min(100, Math.round((waterProgress.glasses / waterProgress.targetGlasses) * 100));

  const hasHeartDisease = summary?.conditions?.includes('heart disease');
  const hasKidneyIssues = summary?.conditions?.includes('kidney issues');

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Emergency & Red Flag banner */}
      <EmergencyBanner doctorClearanceRequired={hasHeartDisease || hasKidneyIssues} />

      {/* Low stock pill warning */}
      {(summary?.lowStockCount || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Medicine Stock Alert
              </h4>
              <p className="text-xs text-amber-700">
                {summary?.lowStockCount} medicine{summary?.lowStockCount === 1 ? ' has' : 's have'} 5 or fewer pills remaining. Time to request a refill from your pharmacy.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('medicines')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Review Stock
          </button>
        </div>
      )}

      {/* Key Hero Row: Today's Medicine Progress & Next Dose Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Medicine Adherence Ring Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Schedule
            </span>
            <button
              onClick={() => onNavigateTab('medicines')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              Timeline <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="my-5 flex items-center justify-center">
            <ProgressRing
              percentage={medProgress.percentage}
              size={135}
              strokeWidth={12}
              color={medProgress.allCompleted ? '#059669' : '#10B981'}
              bgColor="#F1F5F9"
            >
              <div className="text-center">
                <span className="text-2xl font-black text-slate-900">
                  {medProgress.percentage}%
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  {medProgress.taken} / {medProgress.total} Doses
                </span>
              </div>
            </ProgressRing>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            {medProgress.allCompleted && medProgress.total > 0 ? (
              <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All doses taken for today!
              </p>
            ) : medProgress.total === 0 ? (
              <p className="text-xs text-slate-400">No medicines scheduled for today.</p>
            ) : (
              <p className="text-xs text-slate-500">
                <span className="font-bold text-emerald-700">{medProgress.total - medProgress.taken}</span> remaining dose{medProgress.total - medProgress.taken === 1 ? '' : 's'} today.
              </p>
            )}
          </div>
        </div>

        {/* Next Upcoming Dose Countdown Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-700/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Next Scheduled Dose
              </span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md">
              <Pill className="w-4 h-4 text-emerald-100" />
            </div>
          </div>

          {summary?.nextUpcomingDose ? (
            <div className="my-4 space-y-2">
              <span className="inline-block text-3xl font-black tracking-tight">
                {summary.nextUpcomingDose.time}
              </span>
              <h3 className="text-xl font-bold leading-tight">
                {summary.nextUpcomingDose.name}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {summary.nextUpcomingDose.dose && `Dose: ${summary.nextUpcomingDose.dose} • `}
                <span className="capitalize">{summary.nextUpcomingDose.mealTiming?.replace('_', ' ') || 'scheduled'}</span>
              </p>
            </div>
          ) : (
            <div className="my-6 text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-300/80 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">All caught up!</p>
              <p className="text-xs text-emerald-100">No pending doses right now.</p>
            </div>
          )}

          <button
            onClick={() => onNavigateTab('medicines')}
            className="w-full py-2.5 rounded-xl bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition-colors active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Open Medicine Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Daily Water Tracker Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Droplet className="w-4 h-4 text-teal-500 fill-teal-500" />
              <span>Daily Hydration</span>
            </div>
            <span className="text-xs font-bold text-teal-600">
              {waterProgress.liters}L / 2.0L
            </span>
          </div>

          <div className="my-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900">{waterProgress.glasses}</span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">
                  / {waterProgress.targetGlasses} Glasses
                </span>
              </div>
              <span className="text-xs font-bold text-teal-600">{waterPercent}%</span>
            </div>

            {/* Visual glasses bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Increment / Decrement Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleWaterAction('decrement')}
              disabled={waterProgress.glasses <= 0 || waterUpdating}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>250 ml</span>
            </button>
            <button
              onClick={() => handleWaterAction('increment')}
              disabled={waterUpdating}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+1 Glass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Today's Meal Snapshot & Today's Workout Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Meals Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Adapted Meals</h3>
                <p className="text-[11px] text-slate-400">Tailored to your health conditions</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('diet')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              Full 7-Day Plan <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {summary?.todayMeals ? (
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block">Breakfast</span>
                  <span className="font-bold text-slate-800">{summary.todayMeals.breakfast?.name}</span>
                  {summary.todayMeals.breakfast?.reason && (
                    <p className="text-[10px] text-emerald-700 mt-0.5">{summary.todayMeals.breakfast.reason}</p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {summary.todayMeals.breakfast?.calories} kcal
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block">Lunch</span>
                  <span className="font-bold text-slate-800">{summary.todayMeals.lunch?.name}</span>
                  {summary.todayMeals.lunch?.reason && (
                    <p className="text-[10px] text-emerald-700 mt-0.5">{summary.todayMeals.lunch.reason}</p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {summary.todayMeals.lunch?.calories} kcal
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block">Dinner</span>
                  <span className="font-bold text-slate-800">{summary.todayMeals.dinner?.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {summary.todayMeals.dinner?.calories} kcal
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No meal plan generated yet.
            </div>
          )}
        </div>

        {/* Today's Workout Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Safe Movement</h3>
                <p className="text-[11px] text-slate-400">
                  {summary?.todayWorkout?.title || 'Condition-adapted exercise'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('exercise')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center"
            >
              View Workouts <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {summary?.todayWorkout ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-900">
                    {summary.todayWorkout.type}
                  </span>
                  <span className="text-xs font-semibold text-teal-700">
                    ~{summary.todayWorkout.estimated_duration_mins} mins • {summary.todayWorkout.estimated_calories} kcal
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {summary.todayWorkout.cautions || 'Keep breathing steady and stay hydrated throughout.'}
                </p>

                <button
                  onClick={() => onStartWorkout(summary.todayWorkout)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Start Guided Workout Player</span>
                </button>
              </div>

              {/* Quick list of exercises */}
              <div className="space-y-1.5">
                {summary.todayWorkout.exercises?.slice(0, 3).map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800">{ex.name}</span>
                    <span className="text-[11px] text-slate-500">{ex.sets} sets &times; {ex.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No exercise routine loaded.
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Daily Health Tip & Action Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-200/80 flex items-start gap-4">
        <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-sm">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Daily Health Tip • {summary?.dailyTip?.category || 'Wellness'}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">
            {summary?.dailyTip?.title || 'Habit Stacking'}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {summary?.dailyTip?.text}
          </p>
        </div>
      </div>
    </div>
  );
};
