import React, { useState } from 'react';
import { AlertCircle, PhoneCall, ChevronDown, ChevronUp, ShieldAlert, HeartPulse } from 'lucide-react';

interface EmergencyBannerProps {
  doctorClearanceRequired?: boolean;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ doctorClearanceRequired }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6 space-y-3">
      {/* Doctor clearance banner if applicable */}
      {doctorClearanceRequired && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 text-sm">
          <HeartPulse className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-amber-800">Doctor Clearance Recommended:</span> Your health profile includes conditions requiring physician supervision. Please consult your doctor before making major adjustments to diet or physical activity.
          </div>
        </div>
      )}

      {/* Emergency symptoms guidance banner */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 overflow-hidden text-rose-950 transition-all">
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 leading-snug">
                Medical Emergency Red Flags
              </h4>
              <p className="text-xs text-rose-700">
                Experiencing acute symptoms? Do not wait for an app reminder.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:911"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 911 / EMS</span>
            </a>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors"
              aria-label="Toggle emergency symptoms"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-rose-200/60 text-xs text-rose-800 space-y-2 animate-in fade-in">
            <p className="font-semibold text-rose-900">
              Call emergency medical services immediately if you experience:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sudden chest pain, pressure, squeezing, or pain spreading to arm, neck, or jaw</li>
              <li>Severe shortness of breath, wheezing that does not respond to rescue inhaler</li>
              <li>Sudden numbness, facial drooping, speech difficulty, or weakness on one side of the body</li>
              <li>Extreme dizziness, confusion, or blood sugar below 54 mg/dL with altered awareness</li>
              <li>Systolic blood pressure above 180 mmHg or diastolic above 120 mmHg with headache</li>
            </ul>
            <div className="pt-2 text-[11px] text-rose-600 font-medium italic">
              Healthify is a tracking and reminder tool. It is not an emergency response system.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
