import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Activity,
  Droplet,
  Scale,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { VitalRecord } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { EmergencyBanner } from '../components/EmergencyBanner.js';

interface VitalsPageProps {
  onOpenVitalModal: (defaultType?: 'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate') => void;
}

export const VitalsPage: React.FC<VitalsPageProps> = ({ onOpenVitalModal }) => {
  const { success, error } = useToast();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [latest, setLatest] = useState<Record<string, VitalRecord>>({});
  const [loading, setLoading] = useState(true);

  const fetchVitals = async () => {
    try {
      const res = await api.getVitals(activeFilter === 'all' ? undefined : activeFilter);
      if (res.success && res.data) {
        setVitals(res.data.records || []);
        if (res.data.latest) {
          setLatest(res.data.latest);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [activeFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vital log entry?')) return;
    try {
      const res = await api.deleteVital(id);
      if (res.success) {
        success('Vital entry deleted.');
        await fetchVitals();
      }
    } catch (e) {
      error('Failed to delete vital entry');
    }
  };

  const getStatusBadge = (flag: string) => {
    if (flag === 'critical') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Critical
        </span>
      );
    }
    if (flag === 'high') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          High Range
        </span>
      );
    }
    if (flag === 'elevated') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Elevated
        </span>
      );
    }
    if (flag === 'low') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
          Low
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Normal
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  // BP Records for mini SVG sparkline
  const bpRecords = vitals.filter(v => v.type === 'blood_pressure').slice(0, 10).reverse();
  const glucoseRecords = vitals.filter(v => v.type === 'blood_sugar').slice(0, 10).reverse();

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-12">
      <EmergencyBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vitals Tracker</h2>
          <p className="text-xs text-slate-500">
            Monitor blood pressure, blood glucose, weight trends, and pulse with clinical ranges.
          </p>
        </div>

        <button
          onClick={() => onOpenVitalModal()}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Vital</span>
        </button>
      </div>

      {/* 4 Cards: Latest Vitals Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div
          onClick={() => onOpenVitalModal('blood_pressure')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Pressure</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900">
              {latest.blood_pressure
                ? `${latest.blood_pressure.value_primary}/${latest.blood_pressure.value_secondary}`
                : '--/--'}
              <span className="text-xs font-semibold text-slate-400 ml-1">mmHg</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {latest.blood_pressure ? latest.blood_pressure.recorded_at?.slice(0, 10) : 'No logs yet'}
              </span>
              {latest.blood_pressure && getStatusBadge(latest.blood_pressure.status_flag)}
            </div>
          </div>
        </div>

        {/* Blood Sugar */}
        <div
          onClick={() => onOpenVitalModal('blood_sugar')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Glucose</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Droplet className="w-4 h-4 fill-teal-600" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900">
              {latest.blood_sugar ? latest.blood_sugar.value_primary : '--'}
              <span className="text-xs font-semibold text-slate-400 ml-1">mg/dL</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {latest.blood_sugar ? latest.blood_sugar.notes || 'Recorded' : 'No logs yet'}
              </span>
              {latest.blood_sugar && getStatusBadge(latest.blood_sugar.status_flag)}
            </div>
          </div>
        </div>

        {/* Body Weight */}
        <div
          onClick={() => onOpenVitalModal('weight')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Body Weight</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900">
              {latest.weight ? latest.weight.value_primary : '--'}
              <span className="text-xs font-semibold text-slate-400 ml-1">kg</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {latest.weight ? latest.weight.recorded_at?.slice(0, 10) : 'No logs yet'}
              </span>
              {latest.weight && getStatusBadge(latest.weight.status_flag)}
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <div
          onClick={() => onOpenVitalModal('heart_rate')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Resting Pulse</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900">
              {latest.heart_rate ? latest.heart_rate.value_primary : '--'}
              <span className="text-xs font-semibold text-slate-400 ml-1">bpm</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Target: 60 - 100</span>
              {latest.heart_rate && getStatusBadge(latest.heart_rate.status_flag)}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Visual Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blood pressure trend */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Blood Pressure History</h4>
            <span className="text-xs text-slate-400">Last readings</span>
          </div>

          {bpRecords.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-2 h-28 pt-4 border-b border-slate-100">
                {bpRecords.map((r, i) => {
                  const heightPercent = Math.min(100, Math.max(20, ((r.value_primary - 80) / 100) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] text-slate-400 truncate w-full text-center">
                        {r.value_primary}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Systolic Trend (Ideal &lt; 120 mmHg)</span>
                <span>Latest: {latest.blood_pressure?.value_primary || '--'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No blood pressure logs yet.</p>
          )}
        </div>

        {/* Blood sugar trend */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Blood Sugar History</h4>
            <span className="text-xs text-slate-400">Last readings</span>
          </div>

          {glucoseRecords.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-2 h-28 pt-4 border-b border-slate-100">
                {glucoseRecords.map((r, i) => {
                  const heightPercent = Math.min(100, Math.max(20, ((r.value_primary - 50) / 200) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-teal-500 rounded-t-lg transition-all group-hover:bg-teal-600"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] text-slate-400 truncate w-full text-center">
                        {r.value_primary}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Glucose Trend (Fasting Target 70-99 mg/dL)</span>
                <span>Latest: {latest.blood_sugar?.value_primary || '--'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No glucose logs yet.</p>
          )}
        </div>
      </div>

      {/* Filter and Historical Log Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Biometric Reading Logs</h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {['all', 'blood_pressure', 'blood_sugar', 'weight', 'heart_rate'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  activeFilter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="pb-3 font-bold">Date & Time</th>
                <th className="pb-3 font-bold">Metric</th>
                <th className="pb-3 font-bold">Value</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold">Context / Notes</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vitals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No readings found for this filter.
                  </td>
                </tr>
              ) : (
                vitals.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-medium text-slate-500 whitespace-nowrap">
                      {v.recorded_at?.slice(0, 16)}
                    </td>
                    <td className="py-3 font-bold capitalize whitespace-nowrap text-slate-900">
                      {v.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 font-extrabold text-slate-900 whitespace-nowrap">
                      {v.type === 'blood_pressure'
                        ? `${v.value_primary}/${v.value_secondary} ${v.unit}`
                        : `${v.value_primary} ${v.unit}`}
                    </td>
                    <td className="py-3 whitespace-nowrap">{getStatusBadge(v.status_flag)}</td>
                    <td className="py-3 text-slate-500 max-w-xs truncate">{v.notes || '--'}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete reading"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
