import React, { useState } from 'react';
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface ResetPasswordPageProps {
  initialToken?: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialToken = '',
  onSuccess,
  onBackToLogin,
}) => {
  const { success, error } = useToast();
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      error('Please provide a reset token.');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      error('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token: token.trim(), newPassword });
      if (res.success) {
        success('Password updated successfully! Please sign in with your new password.');
        onSuccess();
      } else {
        error(res.message || 'Reset failed. Token may have expired.');
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

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Password</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Set a secure new password for your Healthify account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reset Token</label>
            <input
              type="text"
              required
              placeholder="Paste the reset token"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              placeholder="8+ chars with letter & number"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
