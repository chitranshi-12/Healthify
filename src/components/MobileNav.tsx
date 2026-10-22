import React from 'react';
import {
  LayoutDashboard,
  Pill,
  Utensils,
  Activity,
  HeartPulse,
  User,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, setCurrentTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'exercise', label: 'Workout', icon: Activity },
    { id: 'vitals', label: 'Vitals', icon: HeartPulse },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100/80 px-2 py-1 shadow-lg shadow-emerald-950/5">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-2 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-emerald-600 scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-emerald-700' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
