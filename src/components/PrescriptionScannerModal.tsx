import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Check, ShieldAlert, AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface PrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExtractedMed {
  name: string;
  dose: string;
  form: string;
  frequency_per_day: number;
  times_of_day: string[];
  meal_timing: string;
  notes: string;
  stock_quantity: number;
}

export const PrescriptionScannerModal: React.FC<PrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMed[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setBase64Data(result);
      setHasScanned(false);
      setExtractedMeds([]);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!base64Data) {
      error('Please select or capture a prescription photo first.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.extractPrescription(base64Data);
      if (res.success && res.data?.extractedMedicines) {
        setExtractedMeds(res.data.extractedMedicines);
        setHasScanned(true);
        success('Prescription scanned! Please review and verify each field below before saving.');
      } else {
        error(res.message || 'Could not extract medicines from image. Please enter manually.');
      }
    } catch (err) {
      error('Failed to process prescription image.');
    } finally {
      setLoading(false);
    }
  };

  const updateMedField = (index: number, field: keyof ExtractedMed, value: any) => {
    setExtractedMeds(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeMed = (index: number) => {
    setExtractedMeds(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (extractedMeds.length === 0) {
      warning('No medicines to save.');
      return;
    }

    setSavingAll(true);
    try {
      for (const med of extractedMeds) {
        if (!med.name.trim() || !med.dose.trim()) continue;
        await api.addMedicine({
          name: med.name,
          dose: med.dose,
          form: med.form || 'tablet',
          frequency_per_day: med.frequency_per_day || 1,
          times_of_day: med.times_of_day?.length ? med.times_of_day : ['08:00'],
          meal_timing: med.meal_timing || 'after_food',
          days_of_week: 'everyday',
          stock_quantity: med.stock_quantity || 30,
          notes: med.notes || '',
        });
      }

      success(`Successfully added ${extractedMeds.length} prescription reminder(s)!`);
      onSuccess();
      onClose();
    } catch (err) {
      error('Failed to save some prescription medicines.');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Scan Prescription</h3>
              <p className="text-xs text-slate-500">Extract doctor's prescribed medicines automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety guardrail disclaimer */}
        <div className="my-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Medical Safety Check:</span> AI extracts text from your photo, but never prescribes or changes medicines. You must carefully verify every medicine name, dose, and time against your doctor’s physical prescription before saving.
          </div>
        </div>

        {/* Image upload area */}
        {!hasScanned && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-emerald-50/30 hover:bg-emerald-50/60 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="max-h-56 mx-auto rounded-2xl object-contain border border-slate-200 shadow-sm"
                  />
                  <p className="text-xs text-slate-500">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Upload or snap a prescription photo
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports JPG, PNG, WEBP (clear, well-lit photos work best)
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={!previewUrl || loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning prescription with Gemini...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Extract Medicines</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Review & confirm extracted medicines */}
        {hasScanned && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Extracted Medicines ({extractedMeds.length})
              </h4>
              <button
                type="button"
                onClick={() => setHasScanned(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Scan another photo
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {extractedMeds.map((med, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Medicine #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMed(idx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={e => updateMedField(idx, 'name', e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dose</label>
                      <input
                        type="text"
                        value={med.dose}
                        onChange={e => updateMedField(idx, 'dose', e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Form</label>
                      <input
                        type="text"
                        value={med.form}
                        onChange={e => updateMedField(idx, 'form', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Timing</label>
                      <select
                        value={med.meal_timing}
                        onChange={e => updateMedField(idx, 'meal_timing', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="after_food">After Food</option>
                        <option value="before_food">Before Food</option>
                        <option value="empty_stomach">Empty Stomach</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Stock</label>
                      <input
                        type="number"
                        value={med.stock_quantity || 30}
                        onChange={e => updateMedField(idx, 'stock_quantity', Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                onClick={handleSaveAll}
                disabled={savingAll || extractedMeds.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{savingAll ? 'Saving Reminders...' : 'Confirm & Save All Reminders'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
