import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Plus,
  Camera,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  Flame,
  TrendingUp,
  PackageCheck,
  HeartPulse,
} from 'lucide-react';
import { Medicine, ScheduleItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { ProgressRing } from '../components/ProgressRing.js';
import confetti from 'canvas-confetti';

interface MedicinesPageProps {
  onOpenAddMedicine: (editing?: Medicine | null) => void;
  onOpenScanner: () => void;
}

export const MedicinesPage: React.FC<MedicinesPageProps> = ({
  onOpenAddMedicine,
  onOpenScanner,
}) => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'timeline' | 'allMedicines' | 'careChecklists'>('timeline');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // New care checklist form
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [chkTitle, setChkTitle] = useState('');
  const [chkTime, setChkTime] = useState('08:00');

  const fetchData = async () => {
    try {
      const [schedRes, medsRes, adhRes] = await Promise.all([
        api.getTodayReminders(),
        api.getMedicines(),
        api.getAdherence(),
      ]);

      if (schedRes.success && schedRes.data?.schedule) {
        setSchedule(schedRes.data.schedule);
      }
      if (medsRes.success && medsRes.data) {
        setMedicines(medsRes.data);
      }
      if (adhRes.success && adhRes.data) {
        setAdherenceData(adhRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLog = async (item: ScheduleItem, status: 'taken' | 'skipped' | 'snoozed') => {
    setProcessingId(item.id);
    try {
      const res = await api.logReminder({
        medicine_id: item.medicine_id,
        care_checklist_id: item.care_checklist_id,
        item_name: item.title,
        scheduled_time: item.scheduled_time,
        status,
      });

      if (res.success) {
        if (status === 'taken') {
          success(`Marked ${item.title} as taken!`);
          // Check if this was the last dose to trigger celebration confetti
          const pendingRemaining = schedule.filter(s => s.id !== item.id && s.status === 'pending');
          if (pendingRemaining.length === 0) {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        } else if (status === 'snoozed') {
          info(`Snoozed ${item.title} for 10 minutes.`);
        } else {
          info(`Marked ${item.title} as skipped.`);
        }
        await fetchData();
      } else {
        error(res.message || 'Failed to update reminder status');
      }
    } catch (e) {
      error('Error logging reminder');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteMed = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from your reminders?`)) return;
    try {
      const res = await api.deleteMedicine(id);
      if (res.success) {
        success(`Removed ${name}.`);
        await fetchData();
      } else {
        error(res.message || 'Failed to remove medicine');
      }
    } catch (e) {
      error('Failed to delete medicine');
    }
  };

  const handleAddCareChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chkTitle.trim()) return;
    try {
      const res = await api.addCareChecklist({
        title: chkTitle.trim(),
        scheduled_time: chkTime,
        condition_name: 'custom',
      });
      if (res.success) {
        success('Care checklist reminder added!');
        setChkTitle('');
        setShowAddChecklist(false);
        await fetchData();
      }
    } catch (e) {
      error('Failed to add care checklist');
    }
  };

  const totalDoses = schedule.length;
  const takenDoses = schedule.filter(s => s.status === 'taken').length;
  const adherencePercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  // Preset condition checklists for 1-tap add
  const PRESET_CHECKLISTS = [
    { title: 'Check Fasting Blood Sugar', time: '07:30', condition: 'Diabetes' },
    { title: 'Inspect Feet & Heels', time: '21:30', condition: 'Diabetes' },
    { title: 'Morning BP Cuff Measurement', time: '08:15', condition: 'Hypertension' },
    { title: 'Evening BP Cuff Measurement', time: '20:30', condition: 'Hypertension' },
    { title: 'Thyroid Dose on Empty Stomach', time: '06:30', condition: 'Thyroid' },
    { title: 'Pack Rescue Inhaler in Bag', time: '07:45', condition: 'Asthma' },
  ];

  const handleAddPresetChecklist = async (preset: { title: string; time: string; condition: string }) => {
    try {
      const res = await api.addCareChecklist({
        title: preset.title,
        scheduled_time: preset.time,
        condition_name: preset.condition.toLowerCase(),
      });
      if (res.success) {
        success(`Added "${preset.title}" to daily checklist!`);
        await fetchData();
      }
    } catch (e) {
      error('Failed to add checklist');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-72 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Header Actions & Prescriptions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Schedule</h2>
          <p className="text-xs text-slate-500">
            Timely doses, refill alerts & condition care checklists. Always follow your doctor’s prescription.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span>Scan Prescription</span>
          </button>

          <button
            onClick={() => onOpenAddMedicine(null)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'timeline' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Today's Timeline ({schedule.length})
          {activeTab === 'timeline' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('allMedicines')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'allMedicines' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          All Medicines ({medicines.length})
          {activeTab === 'allMedicines' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('careChecklists')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'careChecklists' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Condition Care Checklists
          {activeTab === 'careChecklists' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: TODAY'S TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Adherence & Streak stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-white border border-emerald-100/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Progress</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {takenDoses} of {totalDoses} Done
                </div>
              </div>
              <ProgressRing percentage={adherencePercent} size={48} strokeWidth={6}>
                <span className="text-[10px] font-bold text-slate-800">{adherencePercent}%</span>
              </ProgressRing>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-emerald-100/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Current Streak</span>
                <div className="text-xl font-black text-amber-700 mt-0.5">
                  {adherenceData?.streak || 0} Consecutive Days
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-emerald-100/80 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500 text-white shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">7-Day Adherence</span>
                <div className="text-xl font-black text-teal-700 mt-0.5">
                  {adherenceData?.weeklyAdherence ?? 100}%
                </div>
              </div>
            </div>
          </div>

          {/* Timeline list */}
          <div className="space-y-3">
            {schedule.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Pill className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Reminders for Today</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your doctor-prescribed medications or condition checklists to build your daily timeline.
                </p>
                <button
                  onClick={() => onOpenAddMedicine(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Add Your First Medicine
                </button>
              </div>
            ) : (
              schedule.map(item => {
                const isTaken = item.status === 'taken';
                const isSkipped = item.status === 'skipped';
                const isSnoozed = item.status === 'snoozed';
                const isOverdue = item.is_overdue;

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200/80 shadow-sm'
                        : isOverdue
                        ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Time & Item info */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${
                          isTaken
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <Clock className="w-4 h-4 mb-0.5 opacity-60" />
                        <span className="text-xs leading-none">{item.scheduled_time}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 leading-tight">
                            {item.title}
                          </h4>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                          {isTaken && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Taken at {item.taken_at ? item.taken_at.slice(11, 16) : item.scheduled_time}
                            </span>
                          )}
                          {isSkipped && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                              Skipped
                            </span>
                          )}
                          {isSnoozed && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Snoozed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {item.dose && (
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {item.dose} ({item.form || 'tablet'})
                            </span>
                          )}
                          {item.meal_timing && (
                            <span className="capitalize text-slate-600">
                              • {item.meal_timing.replace('_', ' ')}
                            </span>
                          )}
                          {item.stock_quantity !== undefined && (
                            <span className={item.stock_quantity <= 5 ? 'text-amber-600 font-bold' : ''}>
                              • {item.stock_quantity} left
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-400 italic">"{item.notes}"</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isTaken ? (
                        <button
                          onClick={() => handleLog(item, 'skipped')}
                          disabled={processingId === item.id}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Undo
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleLog(item, 'snoozed')}
                            disabled={processingId === item.id}
                            title="Snooze 10 minutes"
                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-700 transition-all active:scale-95"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleLog(item, 'skipped')}
                            disabled={processingId === item.id}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all active:scale-95"
                          >
                            Skip
                          </button>

                          <button
                            onClick={() => handleLog(item, 'taken')}
                            disabled={processingId === item.id}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Mark Taken</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL MEDICINES LIST */}
      {activeTab === 'allMedicines' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicines.map(med => (
              <div
                key={med.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
              >
                {med.is_low_stock && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    Low Stock: {med.stock_quantity} left
                  </div>
                )}

                <div className="flex items-start justify-between pr-14">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{med.name}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">{med.dose} • {med.form}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Scheduled Times</span>
                    <span className="font-semibold text-slate-800">
                      {Array.isArray(med.times_of_day) ? med.times_of_day.join(', ') : med.times_of_day}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Meal Timing</span>
                    <span className="capitalize font-semibold text-slate-800">
                      {med.meal_timing?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {med.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl">
                    "{med.notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Stock: <strong className="text-slate-700">{med.stock_quantity} pills</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenAddMedicine(med)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMed(med.id, med.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONDITION CARE CHECKLISTS */}
      {activeTab === 'careChecklists' && (
        <div className="space-y-6">
          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <span className="font-bold block text-sm text-emerald-900">What are Care Checklists?</span>
            <p>
              Non-medicine daily health habits (e.g. blood pressure checks, fasting blood sugar logs, foot inspections, rescue inhaler checks) that support chronic disease management. You can add them with one tap to your daily reminder timeline.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">1-Tap Care Presets for Chronic Conditions</h3>
              <button
                onClick={() => setShowAddChecklist(!showAddChecklist)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Habit
              </button>
            </div>

            {/* Custom add habit form */}
            {showAddChecklist && (
              <form onSubmit={handleAddCareChecklist} className="mb-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Habit Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Evening Blood Pressure Log"
                      value={chkTitle}
                      onChange={e => setChkTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={chkTime}
                      onChange={e => setChkTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddChecklist(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm"
                  >
                    Save Habit
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_CHECKLISTS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {preset.condition}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1.5">{preset.title}</h4>
                    <p className="text-[11px] text-slate-400">Scheduled time: {preset.time}</p>
                  </div>

                  <button
                    onClick={() => handleAddPresetChecklist(preset)}
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Daily Schedule</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
