import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Scale,
  Droplet,
  Dumbbell,
  Pill,
} from 'lucide-react';
import { api } from '../services/api.js';
import { ProgressRing } from '../components/ProgressRing.js';

export const ProgressPage: React.FC = () => {
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any>(null);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [adhRes, workRes, vitRes] = await Promise.all([
          api.getAdherence(),
          api.getWorkoutHistory(),
          api.getVitals('weight'),
        ]);

        if (adhRes.success) setAdherenceData(adhRes.data);
        if (workRes.success) setWorkoutHistory(workRes.data);
        if (vitRes.success) setVitalsData(vitRes.data.records || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  const streak = adherenceData?.streak || 0;
  const weeklyAdherence = adherenceData?.weeklyAdherence ?? 100;
  const totalWorkouts = workoutHistory?.totalWorkouts || 0;

  // Badges calculation
  const BADGES = [
    {
      id: 'streak-3',
      title: '3-Day Streak',
      desc: '3 consecutive days with on-time medicines',
      icon: Flame,
      unlocked: streak >= 3,
      color: 'amber',
    },
    {
      id: 'streak-7',
      title: '7-Day Master',
      desc: '1 full week of perfect medicine consistency',
      icon: Award,
      unlocked: streak >= 7,
      color: 'emerald',
    },
    {
      id: 'first-workout',
      title: 'First Workout',
      desc: 'Completed your first guided exercise session',
      icon: Dumbbell,
      unlocked: totalWorkouts >= 1,
      color: 'teal',
    },
    {
      id: 'vital-logger',
      title: 'Biometric Tracker',
      desc: 'Recorded weight and biometric vitals',
      icon: Scale,
      unlocked: vitalsData.length >= 1,
      color: 'sky',
    },
    {
      id: 'adherence-pro',
      title: 'Adherence Pro',
      desc: 'Achieved 85%+ weekly medicine score',
      icon: Pill,
      unlocked: weeklyAdherence >= 85,
      color: 'indigo',
    },
  ];

  const daysBreakdown = adherenceData?.dailyBreakdown || [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Adherence & Wellness Progress</h2>
        <p className="text-xs text-slate-500">
          Track medicine compliance streaks, fitness milestones, and unlocked achievements.
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Weekly Compliance</span>
            <div className="text-3xl font-black text-emerald-700 mt-1">{weeklyAdherence}%</div>
            <p className="text-xs text-slate-500 mt-0.5">Based on last 7 days</p>
          </div>
          <ProgressRing percentage={weeklyAdherence} size={64} strokeWidth={8} color="#059669">
            <span className="text-xs font-bold">{weeklyAdherence}%</span>
          </ProgressRing>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Flame className="w-7 h-7 fill-white" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Current Streak</span>
            <div className="text-3xl font-black text-amber-700 mt-1">{streak} Days</div>
            <p className="text-xs text-slate-500 mt-0.5">Keep the momentum going!</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Workouts Done</span>
            <div className="text-3xl font-black text-teal-700 mt-1">{totalWorkouts}</div>
            <p className="text-xs text-slate-500 mt-0.5">Guided exercise sessions</p>
          </div>
        </div>
      </div>

      {/* 7-Day Adherence Bar Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">7-Day Medicine Adherence</h3>
            <p className="text-xs text-slate-400">Percentage of doses taken on schedule each day</p>
          </div>
        </div>

        <div className="pt-4 pb-2">
          <div className="flex items-end justify-between gap-3 h-44 border-b border-slate-100 px-2 sm:px-6">
            {daysBreakdown.map((d: any, idx: number) => {
              const height = `${Math.max(12, d.percentage)}%`;
              const isFull = d.percentage === 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.percentage}%
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl h-full flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isFull ? 'bg-emerald-600' : d.percentage > 0 ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                      style={{ height }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{d.dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badges / Achievements */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Healthify Badges & Milestones</h3>
            <p className="text-xs text-slate-400">Earn recognition for consistent wellness habits</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            {BADGES.filter(b => b.unlocked).length} / {BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${
                    badge.unlocked
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                    {badge.unlocked && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missed Doses History */}
      {adherenceData?.missedDoses && adherenceData.missedDoses.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Recent Skipped or Missed Doses</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {adherenceData.missedDoses.map((m: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-800">{m.item_name}</span>
                <span className="text-slate-400">
                  {m.scheduled_date} at {m.scheduled_time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
