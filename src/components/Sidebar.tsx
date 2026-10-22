import React from 'react';
import {
  LayoutDashboard,
  Pill,
  Utensils,
  Activity,
  HeartPulse,
  TrendingUp,
  User,
  LogOut,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  streak?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, streak = 0 }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'diet', label: 'Diet Plan', icon: Utensils },
    { id: 'exercise', label: 'Exercise', icon: Activity },
    { id: 'vitals', label: 'Vitals', icon: HeartPulse },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-emerald-100/80 p-5 shrink-0 min-h-screen justify-between select-none shadow-sm">
      <div className="space-y-6">
        {/* Brand Name */}
        <div className="px-3 py-2 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Healthify<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-[11px] font-bold text-emerald-600 tracking-wide uppercase mt-0.5">
            Medicine & Wellness
          </p>
        </div>

        {/* Streak highlight card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900">Adherence Streak</div>
              <div className="text-lg font-black text-amber-700 leading-none mt-0.5">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border-2 border-emerald-200">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.fullName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
