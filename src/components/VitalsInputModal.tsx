import React, { useState } from 'react';
import { X, HeartPulse, Activity, Scale, Droplet, Check, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface VitalsInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate';
}

export const VitalsInputModal: React.FC<VitalsInputModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'blood_pressure',
}) => {
  const { success, error, warning } = useToast();

  const [type, setType] = useState<'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate'>(defaultType);
  const [systolic, setSystolic] = useState<number | ''>(120);
  const [diastolic, setDiastolic] = useState<number | ''>(80);
  const [glucose, setGlucose] = useState<number | ''>(100);
  const [glucoseTiming, setGlucoseTiming] = useState('Fasting');
  const [weight, setWeight] = useState<number | ''>(70);
  const [heartRate, setHeartRate] = useState<number | ''>(72);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let payload: any = { type, notes };

      if (type === 'blood_pressure') {
        if (!systolic || !diastolic) {
          error('Please provide both systolic and diastolic readings.');
          setSubmitting(false);
          return;
        }
        payload.value_primary = Number(systolic);
        payload.value_secondary = Number(diastolic);
        payload.unit = 'mmHg';
      } else if (type === 'blood_sugar') {
        if (!glucose) {
          error('Please enter blood glucose level.');
          setSubmitting(false);
          return;
        }
        payload.value_primary = Number(glucose);
        payload.unit = 'mg/dL';
        payload.timing = glucoseTiming;
      } else if (type === 'weight') {
        if (!weight) {
          error('Please enter body weight.');
          setSubmitting(false);
          return;
        }
        payload.value_primary = Number(weight);
        payload.unit = 'kg';
      } else if (type === 'heart_rate') {
        if (!heartRate) {
          error('Please enter heart rate.');
          setSubmitting(false);
          return;
        }
        payload.value_primary = Number(heartRate);
        payload.unit = 'bpm';
      }

      const res = await api.addVital(payload);
      if (res.success) {
        if (res.data?.evaluation?.isEmergency) {
          warning(`Recorded: ${res.data.evaluation.message}`);
        } else {
          success(`Vital recorded! Status: ${res.data?.evaluation?.flag || 'normal'}`);
        }
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to record vital sign');
      }
    } catch (err) {
      error('Error saving vital');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Vital Sign</h3>
              <p className="text-xs text-slate-500">Track and monitor your biometric indicators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vital Type Selector */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <button
            type="button"
            onClick={() => setType('blood_pressure')}
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
              type === 'blood_pressure'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[11px] font-bold">BP</span>
          </button>

          <button
            type="button"
            onClick={() => setType('blood_sugar')}
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
              type === 'blood_sugar'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span className="text-[11px] font-bold">Sugar</span>
          </button>

          <button
            type="button"
            onClick={() => setType('weight')}
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
              type === 'weight'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span className="text-[11px] font-bold">Weight</span>
          </button>

          <button
            type="button"
            onClick={() => setType('heart_rate')}
            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 text-center transition-all ${
              type === 'heart_rate'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span className="text-[11px] font-bold">Pulse</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'blood_pressure' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="260"
                    required
                    value={systolic}
                    onChange={e => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">Target: &lt;120</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="160"
                    required
                    value={diastolic}
                    onChange={e => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">Target: &lt;80</span>
                </div>
              </div>
            </div>
          )}

          {type === 'blood_sugar' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  min="20"
                  max="600"
                  required
                  value={glucose}
                  onChange={e => setGlucose(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timing</label>
                <select
                  value={glucoseTiming}
                  onChange={e => setGlucoseTiming(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="Fasting">Fasting (Morning Before Food)</option>
                  <option value="2h Post-Meal">2h Post-Meal</option>
                  <option value="Bedtime">Bedtime</option>
                  <option value="Random">Random Check</option>
                </select>
              </div>
            </div>
          )}

          {type === 'weight' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                required
                value={weight}
                onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
          )}

          {type === 'heart_rate' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resting Pulse (BPM)</label>
              <input
                type="number"
                min="30"
                max="220"
                required
                value={heartRate}
                onChange={e => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
              <span className="text-[10px] text-slate-400">Normal resting: 60 - 100 bpm</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Context (optional)</label>
            <input
              type="text"
              placeholder="e.g. Post-morning brisk walk, felt energetic"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
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
              {submitting ? 'Recording...' : 'Save Vital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
