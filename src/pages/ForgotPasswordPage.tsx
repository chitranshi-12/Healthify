import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onGoToResetWithToken: (token: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
  onGoToResetWithToken,
}) => {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        success('Password reset link generated! Check server console.');
        if (res.data?.devResetToken) {
          setDevToken(res.data.devResetToken);
        }
      } else {
        error(res.message || 'Error processing request');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
          <span className="font-black text-slate-900 text-lg">
            Healthify<span className="text-emerald-500">.</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Enter your registered email address. We'll generate a secure reset link.
        </p>

        {devToken ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Reset Link Ready</span>
            </div>
            <p className="text-xs text-emerald-800">
              In this preview environment, the reset link was printed to the server console and is also available below:
            </p>
            <button
              onClick={() => onGoToResetWithToken(devToken)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Proceed to Reset Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="demo@healthify.app"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
