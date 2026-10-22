import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Camera, Pill, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Medicine } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenScanner: () => void;
  editingMedicine?: Medicine | null;
}

const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'inhaler'];
const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenScanner,
  editingMedicine,
}) => {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [form, setForm] = useState('tablet');
  const [mealTiming, setMealTiming] = useState('after_food');
  const [timesOfDay, setTimesOfDay] = useState<string[]>(['08:00']);
  const [repeatMode, setRepeatMode] = useState<'everyday' | 'custom'>('everyday');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [stockQuantity, setStockQuantity] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingMedicine) {
      setName(editingMedicine.name);
      setDose(editingMedicine.dose);
      setForm(editingMedicine.form || 'tablet');
      setMealTiming(editingMedicine.meal_timing || 'after_food');
      setTimesOfDay(editingMedicine.times_of_day || ['08:00']);
      setStockQuantity(editingMedicine.stock_quantity ?? 30);
      setStartDate(editingMedicine.start_date || new Date().toISOString().slice(0, 10));
      setEndDate(editingMedicine.end_date || '');
      setNotes(editingMedicine.notes || '');

      if (Array.isArray(editingMedicine.days_of_week)) {
        setRepeatMode('custom');
        setSelectedDays(editingMedicine.days_of_week);
      } else {
        setRepeatMode('everyday');
      }
    } else {
      setName('');
      setDose('');
      setForm('tablet');
      setMealTiming('after_food');
      setTimesOfDay(['08:00']);
      setRepeatMode('everyday');
      setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
      setStockQuantity(30);
      setNotes('');
    }
  }, [editingMedicine, isOpen]);

  if (!isOpen) return null;

  const handleAddTime = () => {
    setTimesOfDay(prev => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (timesOfDay.length <= 1) return;
    setTimesOfDay(prev => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, val: string) => {
    setTimesOfDay(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim()) {
      error('Please provide both medicine name and dosage.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        dose: dose.trim(),
        form,
        meal_timing: mealTiming,
        frequency_per_day: timesOfDay.length,
        times_of_day: timesOfDay,
        days_of_week: repeatMode === 'everyday' ? 'everyday' : selectedDays,
        start_date: startDate || null,
        end_date: endDate || null,
        stock_quantity: Number(stockQuantity) || 0,
        notes: notes.trim(),
      };

      let res;
      if (editingMedicine) {
        res = await api.updateMedicine(editingMedicine.id, payload);
      } else {
        res = await api.addMedicine(payload);
      }

      if (res.success) {
        success(editingMedicine ? 'Medicine reminder updated!' : 'Medicine reminder added successfully!');
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to save medicine');
      }
    } catch (err: any) {
      error('An unexpected error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingMedicine ? 'Edit Medicine Reminder' : 'Add Medicine Reminder'}
              </h3>
              <p className="text-xs text-slate-500">Always follow your doctor’s prescribed dosage.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prescription Scanner Banner */}
        {!editingMedicine && (
          <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">Have a prescription photo?</p>
                <p className="text-[11px] text-emerald-700">Use AI to scan details for review.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-all shadow-sm"
            >
              Scan Prescription
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Name & Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medicine Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metformin"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 500 mg, 1 puff"
                value={dose}
                onChange={e => setDose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Form & Meal timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Form</label>
              <select
                value={form}
                onChange={e => setForm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm capitalize bg-white"
              >
                {FORMS.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meal Timing</label>
              <select
                value={mealTiming}
                onChange={e => setMealTiming(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="after_food">After Food</option>
                <option value="before_food">Before Food</option>
                <option value="empty_stomach">Empty Stomach</option>
              </select>
            </div>
          </div>

          {/* Clock times */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Scheduled Times of Day</label>
              <button
                type="button"
                onClick={handleAddTime}
                className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dose Time
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {timesOfDay.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={t}
                    onChange={e => handleTimeChange(idx, e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                  />
                  {timesOfDay.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Repeat days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setRepeatMode('everyday')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  repeatMode === 'everyday'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Every Day
              </button>
              <button
                type="button"
                onClick={() => setRepeatMode('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  repeatMode === 'custom'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Specific Days
              </button>
            </div>

            {repeatMode === 'custom' && (
              <div className="flex justify-between gap-1 pt-1">
                {DAYS.map(d => {
                  const selected = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`w-10 h-9 rounded-xl text-xs font-bold transition-all ${
                        selected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stock quantity & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pills in Stock</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={e => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {stockQuantity <= 5 && (
                <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
                  Low stock alert active (&le;5)
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Take with a large glass of water, avoid grapefruit juice"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingMedicine ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
