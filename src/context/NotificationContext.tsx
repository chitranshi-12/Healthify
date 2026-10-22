import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ScheduleItem } from '../types/index.js';
import { api } from '../services/api.js';

interface NotificationContextType {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  activeAlarm: ScheduleItem | null;
  dismissAlarm: () => void;
  snoozeAlarm: (item: ScheduleItem) => Promise<void>;
  takeAlarmDose: (item: ScheduleItem) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Play a pleasant soothing two-tone chime using Web Audio API
function playSoothingChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.8);

    // Second harmonic tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.2); // D6
    gain2.gain.setValueAtTime(0.15, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.2);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn('Audio chime playback omitted or unsupported:', err);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [activeAlarm, setActiveAlarm] = useState<ScheduleItem | null>(null);
  const triggeredTimesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const dismissAlarm = () => {
    setActiveAlarm(null);
  };

  const takeAlarmDose = async (item: ScheduleItem) => {
    try {
      await api.logReminder({
        medicine_id: item.medicine_id,
        care_checklist_id: item.care_checklist_id,
        item_name: item.title,
        scheduled_time: item.scheduled_time,
        status: 'taken',
      });
      setActiveAlarm(null);
    } catch (e) {
      console.error(e);
    }
  };

  const snoozeAlarm = async (item: ScheduleItem) => {
    try {
      await api.logReminder({
        medicine_id: item.medicine_id,
        care_checklist_id: item.care_checklist_id,
        item_name: item.title,
        scheduled_time: item.scheduled_time,
        status: 'snoozed',
      });
      setActiveAlarm(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Alarm ticker checking scheduled items
  const checkSchedule = useCallback(async () => {
    const token = api.getToken();
    if (!token) return;

    try {
      const res = await api.getTodayReminders();
      if (!res.success || !res.data?.schedule) return;

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      for (const item of res.data.schedule) {
        const triggerKey = `${item.id}-${currentTimeStr}`;
        if (item.scheduled_time === currentTimeStr && item.status === 'pending') {
          if (!triggeredTimesRef.current.has(triggerKey)) {
            triggeredTimesRef.current.add(triggerKey);

            // Play in-app audio chime
            playSoothingChime();

            // Set in-app alarm modal
            setActiveAlarm(item);

            // Trigger system browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const notif = new Notification(`Healthify Reminder: ${item.title}`, {
                body: `${item.dose ? item.dose + ' - ' : ''}Scheduled for ${item.scheduled_time} (${item.meal_timing?.replace('_', ' ') || 'scheduled'})`,
                icon: '/favicon.ico',
                tag: item.id,
              });
              notif.onclick = () => {
                window.focus();
                setActiveAlarm(item);
              };
            }
          }
        }
      }
    } catch (err) {
      // Quiet fail in background ticker
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkSchedule, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [checkSchedule]);

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        requestPermission,
        activeAlarm,
        dismissAlarm,
        snoozeAlarm,
        takeAlarmDose,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
