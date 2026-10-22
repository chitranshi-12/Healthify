import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
  HeartPulse,
  Utensils,
  LogOut,
  Bell,
  Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

const CONDITIONS_LIST = [
  'diabetes',
  'hypertension',
  'high cholesterol',
  'thyroid',
  'pcos',
  'asthma',
  'heart disease',
  'arthritis',
  'obesity',
  'anemia',
  'kidney issues',
  'none',
];

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUserName } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'settings'>('profile');
  const [loading, setLoading] = useState(true);

  // Profile data
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('female');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [foodPreference, setFoodPreference] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [goal, setGoal] = useState('manage condition');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Security password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete account confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.getProfile();
        if (res.success && res.data) {
          const p = res.data.profile;
          if (p) {
            setAge(p.age ?? '');
            setGender(p.gender || 'female');
            setHeightCm(p.height_cm ?? '');
            setWeightKg(p.weight_kg ?? '');
            setActivityLevel(p.activity_level || 'moderate');
            setFoodPreference(p.food_preference || 'vegetarian');
            setCuisine(p.cuisine || '');
            setFoodAllergies(p.food_allergies || '');
            setGoal(p.goal || 'manage condition');
          }
          if (res.data.conditions) {
            setSelectedConditions(res.data.conditions);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    try {
      const res = await api.updateName(fullName.trim());
      if (res.success) {
        updateUserName(fullName.trim());
        success('Name updated successfully!');
      } else {
        error(res.message || 'Failed to update name');
      }
    } catch (e) {
      error('Error updating name');
    }
  };

  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        age: Number(age) || null,
        gender,
        height_cm: Number(heightCm) || null,
        weight_kg: Number(weightKg) || null,
        activity_level: activityLevel,
        food_preference: foodPreference,
        cuisine,
        food_allergies: foodAllergies,
        goal,
        conditions: selectedConditions,
      });

      if (res.success) {
        success('Health profile and condition care guidelines updated!');
      } else {
        error(res.message || 'Failed to update profile');
      }
    } catch (e) {
      error('Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    setSelectedConditions(prev => {
      const filtered = prev.filter(c => c !== 'none');
      return filtered.includes(cond) ? filtered.filter(c => c !== cond) : [...filtered, cond];
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Please fill in both current and new passwords.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      error('New password must be at least 8 characters with letters and numbers.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        error(res.message || 'Failed to update password');
      }
    } catch (e) {
      error('Error updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      warning('Please type DELETE to confirm account removal.');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await api.deleteAccount();
      if (res.success) {
        success('Your account and all associated health records have been permanently erased.');
      } else {
        error(res.message || 'Failed to delete account');
      }
    } catch (e) {
      error('Error during account deletion');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-80 bg-slate-200/70 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-24 lg:pb-12">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account & Health Profile</h2>
        <p className="text-xs text-slate-500">
          Manage your personal details, clinical health conditions, credentials, and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'profile' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Health Profile
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'security' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Security & Password
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: HEALTH PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Full name edit card */}
          <form onSubmit={handleUpdateName} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Update Name
              </button>
            </div>
          </form>

          {/* Health Biometrics & Conditions Form */}
          <form onSubmit={handleSaveHealthProfile} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Biometrics & Nutrition Parameters</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold capitalize"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diet Preference</label>
                <select
                  value={foodPreference}
                  onChange={e => setFoodPreference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold capitalize"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cuisine Preference</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                  placeholder="e.g. Mediterranean, Indian"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allergies</label>
                <input
                  type="text"
                  value={foodAllergies}
                  onChange={e => setFoodAllergies(e.target.value)}
                  placeholder="e.g. Peanuts, Gluten"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Conditions toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Diagnosed Health Conditions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONDITIONS_LIST.map(cond => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cond}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Health Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password change form */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Change Password</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="8+ chars with letters & numbers"
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
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>

          {/* Delete Account Danger Zone */}
          <div className="p-6 rounded-3xl bg-rose-50/60 border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-rose-950">Danger Zone: Delete Account</h3>
                <p className="text-xs text-rose-700">
                  Permanently deletes your account and cascades all your medicines, intake history, vitals, and customized health plans.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-900 mb-1">
                Type <strong className="underline">DELETE</strong> to confirm permanent deletion
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-white text-xs font-bold text-rose-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
