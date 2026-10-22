import React from 'react';
import { Bell, BellRing, HeartPulse, Flame, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { useToast } from '../context/ToastContext.js';

interface HeaderProps {
  onOpenVitalModal: () => void;
  onOpenAddMedicine: () => void;
  streak?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVitalModal, onOpenAddMedicine, streak = 0 }) => {
  const { user, logout } = useAuth();
  const { hasPermission, requestPermission } = useNotification();
  const { success, info } = useToast();

  const handleRequestNotif = async () => {
    const granted = await requestPermission();
    if (granted) {
      success('Browser reminders enabled! You will be notified when your dose is due.');
    } else {
      info('Notification permission was dismissed or not granted. In-app alarms will still alert you.');
    }
  };

  const handleLogout = async () => {
    await logout();
    success('You have been signed out safely.');
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/70 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
      {/* Greeting / Brand on mobile (pure typography, no logo image) */}
      <div className="flex items-center gap-3">
        <span className="lg:hidden font-black text-slate-900 text-lg tracking-tight">
          Healthify<span className="text-emerald-500 font-black">.</span>
        </span>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {greeting}, <span className="text-emerald-700">{user?.fullName?.split(' ')[0] || 'Friend'}</span>
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile streak badge */}
        <div className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{streak}d</span>
        </div>

        {/* Notification Permission button */}
        <button
          onClick={handleRequestNotif}
          title={hasPermission ? 'Notifications active' : 'Enable browser reminders'}
          className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
            hasPermission
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-600'
          }`}
        >
          {hasPermission ? (
            <BellRing className="w-4 h-4 text-emerald-600" />
          ) : (
            <>
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Alerts</span>
            </>
          )}
        </button>

        {/* Quick Log Vitals */}
        <button
          onClick={onOpenVitalModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <HeartPulse className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Log Vitals</span>
        </button>

        {/* Add Medicine quick action */}
        <button
          onClick={onOpenAddMedicine}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Reminder</span>
        </button>

        {/* Header Quick Sign Out button */}
        <button
          onClick={handleLogout}
          title="Sign out of Healthify"
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
