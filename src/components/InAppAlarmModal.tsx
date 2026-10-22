import React from 'react';
import { Bell, Check, Clock, X, Pill, AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext.js';
import { useToast } from '../context/ToastContext.js';

export const InAppAlarmModal: React.FC = () => {
  const { activeAlarm, dismissAlarm, takeAlarmDose, snoozeAlarm } = useNotification();
  const { success, info } = useToast();

  if (!activeAlarm) return null;

  const handleTake = async () => {
    await takeAlarmDose(activeAlarm);
    success(`Marked ${activeAlarm.title} as taken! Great adherence!`);
  };

  const handleSnooze = async () => {
    await snoozeAlarm(activeAlarm);
    info(`Snoozed ${activeAlarm.title} for 10 minutes.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Pulsing alarm bell */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse">
            <Bell className="w-10 h-10" />
          </div>
          <span className="absolute top-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
        </div>

        <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
          Scheduled Reminder • {activeAlarm.scheduled_time}
        </span>

        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
          Time for {activeAlarm.title}
        </h3>

        {activeAlarm.dose && (
          <p className="text-base text-slate-600 font-medium mb-1">
            Dose: <span className="text-emerald-700 font-semibold">{activeAlarm.dose}</span> ({activeAlarm.form || 'tablet'})
          </p>
        )}

        {activeAlarm.meal_timing && (
          <p className="text-sm text-slate-500 capitalize bg-slate-100 px-3 py-1 rounded-lg mb-4">
            {activeAlarm.meal_timing.replace('_', ' ')}
          </p>
        )}

        {activeAlarm.notes && (
          <p className="text-xs text-slate-500 italic mb-5 max-w-xs">
            "{activeAlarm.notes}"
          </p>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mb-3">
          <button
            onClick={handleTake}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm"
          >
            <Check className="w-5 h-5" />
            Taken Now
          </button>

          <button
            onClick={handleSnooze}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold active:scale-95 transition-all text-sm"
          >
            <Clock className="w-5 h-5" />
            Snooze 10m
          </button>
        </div>

        <button
          onClick={dismissAlarm}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 py-1 transition-colors"
        >
          Dismiss reminder
        </button>
      </div>
    </div>
  );
};
