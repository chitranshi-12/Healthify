import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { NotificationProvider } from './context/NotificationContext.js';

import { Sidebar } from './components/Sidebar.js';
import { MobileNav } from './components/MobileNav.js';
import { Header } from './components/Header.js';
import { InAppAlarmModal } from './components/InAppAlarmModal.js';
import { AddMedicineModal } from './components/AddMedicineModal.js';
import { PrescriptionScannerModal } from './components/PrescriptionScannerModal.js';
import { VitalsInputModal } from './components/VitalsInputModal.js';
import { WorkoutPlayerModal } from './components/WorkoutPlayerModal.js';

import { AuthPage } from './pages/AuthPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { MedicinesPage } from './pages/MedicinesPage.js';
import { DietPage } from './pages/DietPage.js';
import { ExercisePage } from './pages/ExercisePage.js';
import { VitalsPage } from './pages/VitalsPage.js';
import { ProgressPage } from './pages/ProgressPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { Medicine, ExerciseDay } from './types/index.js';
import { api } from './services/api.js';

function MainApp() {
  const { user, loading } = useAuth();

  // Navigation states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authView, setAuthView] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [resetToken, setResetToken] = useState('');

  // Modals state
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [vitalDefaultType, setVitalDefaultType] = useState<any>('blood_pressure');
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<ExerciseDay | null>(null);

  // App-level streak
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Check if URL query contains reset token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setAuthView('reset');
    }
  }, []);

  useEffect(() => {
    if (user) {
      api.getAdherence().then(res => {
        if (res.success && res.data?.streak !== undefined) {
          setStreak(res.data.streak);
        }
      }).catch(() => {});
    }
  }, [user]);

  // Loading screen (Clean typography, no logo placeholder)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
        <div className="text-sm font-black text-slate-800 tracking-tight">
          Healthify<span className="text-emerald-500">.</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          Loading your wellness workspace...
        </p>
      </div>
    );
  }

  // Auth & Recovery Flows
  if (!user) {
    if (authView === 'forgot') {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setAuthView('auth')}
          onGoToResetWithToken={token => {
            setResetToken(token);
            setAuthView('reset');
          }}
        />
      );
    }

    if (authView === 'reset') {
      return (
        <ResetPasswordPage
          initialToken={resetToken}
          onSuccess={() => {
            setAuthView('auth');
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
          onBackToLogin={() => setAuthView('auth')}
        />
      );
    }

    return <AuthPage onForgotPassword={() => setAuthView('forgot')} />;
  }

  // Onboarding Flow
  if (!user.onboardingCompleted) {
    return <OnboardingPage onComplete={() => setCurrentTab('dashboard')} />;
  }

  // Authenticated App Shell
  return (
    <div className="min-h-screen flex bg-slate-50/60 font-sans text-slate-900">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        streak={streak}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenVitalModal={() => {
            setVitalDefaultType('blood_pressure');
            setIsVitalModalOpen(true);
          }}
          onOpenAddMedicine={() => {
            setEditingMedicine(null);
            setIsAddMedicineOpen(true);
          }}
          streak={streak}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateTab={tab => setCurrentTab(tab)}
              onOpenAddMedicine={() => {
                setEditingMedicine(null);
                setIsAddMedicineOpen(true);
              }}
              onOpenVitalModal={() => {
                setVitalDefaultType('blood_pressure');
                setIsVitalModalOpen(true);
              }}
              onStartWorkout={workout => setActiveWorkoutDay(workout)}
            />
          )}

          {currentTab === 'medicines' && (
            <MedicinesPage
              onOpenAddMedicine={med => {
                setEditingMedicine(med || null);
                setIsAddMedicineOpen(true);
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {currentTab === 'diet' && <DietPage />}

          {currentTab === 'exercise' && (
            <ExercisePage
              onStartWorkout={day => setActiveWorkoutDay(day)}
            />
          )}

          {currentTab === 'vitals' && (
            <VitalsPage
              onOpenVitalModal={type => {
                setVitalDefaultType(type || 'blood_pressure');
                setIsVitalModalOpen(true);
              }}
            />
          )}

          {currentTab === 'progress' && <ProgressPage />}

          {currentTab === 'profile' && <ProfilePage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Global In-App Alarm Popup (Web Audio chime + scheduled alert) */}
      <InAppAlarmModal />

      {/* Add / Edit Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        onSuccess={() => {
          // Re-fetch handled in pages
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        editingMedicine={editingMedicine}
      />

      {/* Prescription Scanner Modal */}
      <PrescriptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          // Re-fetch handled in pages
        }}
      />

      {/* Vitals Input Modal */}
      <VitalsInputModal
        isOpen={isVitalModalOpen}
        onClose={() => setIsVitalModalOpen(false)}
        onSuccess={() => {
          // Handled
        }}
        defaultType={vitalDefaultType}
      />

      {/* Guided Workout Player Modal */}
      <WorkoutPlayerModal
        isOpen={!!activeWorkoutDay}
        onClose={() => setActiveWorkoutDay(null)}
        day={activeWorkoutDay}
        onWorkoutCompleted={() => {
          // Handled
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
