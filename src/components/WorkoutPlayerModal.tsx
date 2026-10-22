import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, SkipForward, Flame, Clock, Info, AlertTriangle } from 'lucide-react';
import { ExerciseDay, ExerciseItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import confetti from 'canvas-confetti';

interface WorkoutPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: ExerciseDay | null;
  onWorkoutCompleted: () => void;
}

export const WorkoutPlayerModal: React.FC<WorkoutPlayerModalProps> = ({
  isOpen,
  onClose,
  day,
  onWorkoutCompleted,
}) => {
  const { success, error } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsResting(false);
      setTimerSeconds(45);
      setIsRunning(false);
      setElapsedTotalSeconds(0);
      setCompletedExercises([]);
    }
  }, [isOpen, day]);

  // Overall workout timer
  useEffect(() => {
    let interval: any;
    if (isOpen && isRunning) {
      interval = setInterval(() => {
        setElapsedTotalSeconds(prev => prev + 1);
        setTimerSeconds(prev => {
          if (prev <= 1) {
            // Auto finish rest or interval
            if (isResting) {
              setIsResting(false);
              return 45;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isRunning, isResting]);

  if (!isOpen || !day) return null;

  const exercises = day.exercises || [];
  const currentEx: ExerciseItem | undefined = exercises[currentIndex];
  const nextEx: ExerciseItem | undefined = exercises[currentIndex + 1];

  const handleNextOrRest = () => {
    if (!completedExercises.includes(currentIndex)) {
      setCompletedExercises(prev => [...prev, currentIndex]);
    }

    if (currentIndex < exercises.length - 1) {
      // Trigger rest period (e.g. 30s)
      setIsResting(true);
      setTimerSeconds(30);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = async () => {
    setFinishing(true);
    const durationMins = Math.max(1, Math.round(elapsedTotalSeconds / 60));
    const estimatedCal = day.estimated_calories || 120;

    try {
      await api.logWorkout({
        dayName: `${day.day} - ${day.title}`,
        durationMinutes: durationMins,
        caloriesBurned: estimatedCal,
        notes: `Completed ${completedExercises.length + 1} exercises.`,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      success(`Workout finished! Logged ${durationMins} mins and ~${estimatedCal} kcal.`);
      onWorkoutCompleted();
      onClose();
    } catch (e) {
      error('Failed to log workout completion');
    } finally {
      setFinishing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {day.day} • {day.type}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{day.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Time & Progress bar */}
        <div className="py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Active Time: {formatTime(elapsedTotalSeconds)}</span>
          </div>
          <span className="font-bold text-emerald-700">
            Exercise {currentIndex + 1} of {exercises.length}
          </span>
        </div>

        {/* Progress pills */}
        <div className="flex gap-1.5 mb-4">
          {exercises.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-emerald-500 ring-2 ring-emerald-200'
                  : completedExercises.includes(idx)
                  ? 'bg-emerald-300'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Rest Period State */}
        {isResting ? (
          <div className="my-auto py-8 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Rest & Breathe
            </span>
            <div className="text-6xl font-black text-amber-600 font-mono tracking-tight">
              {timerSeconds}s
            </div>
            <p className="text-xs text-slate-500">
              Take deep diaphragmatic breaths and sip water.
            </p>
            {nextEx && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Up Next</span>
                <p className="text-xs font-bold text-slate-800">{nextEx.name}</p>
                <p className="text-[11px] text-slate-500">{nextEx.sets} sets &times; {nextEx.reps}</p>
              </div>
            )}
            <button
              onClick={() => {
                setIsResting(false);
                setTimerSeconds(45);
              }}
              className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm"
            >
              Skip Rest
            </button>
          </div>
        ) : currentEx ? (
          /* Active Exercise Card */
          <div className="space-y-4 my-auto">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {currentEx.name}
                </h4>
                <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0">
                  {currentEx.sets} sets &times; {currentEx.reps}
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Target Rest: <span className="font-semibold text-slate-800">{currentEx.rest}</span>
              </p>
            </div>

            {/* Timer countdown / stopwatch */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-4xl font-extrabold text-slate-800 font-mono">
                {formatTime(timerSeconds)}
              </div>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                onClick={() => setTimerSeconds(45)}
                className="p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset timer to 45s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* How-To & Form Guidance */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">How-To:</span>
                {currentEx.howTo}
              </div>

              {currentEx.commonMistake && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900">
                  <span className="font-bold text-amber-950">Avoid: </span>
                  {currentEx.commonMistake}
                </div>
              )}

              {currentEx.easierOption && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900">
                  <span className="font-bold text-emerald-950">Easier Option: </span>
                  {currentEx.easierOption}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            End Workout Early
          </button>

          <button
            onClick={handleNextOrRest}
            disabled={finishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {currentIndex === exercises.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                <span>{finishing ? 'Completing...' : 'Complete Workout'}</span>
              </>
            ) : (
              <>
                <span>Next Exercise</span>
                <SkipForward className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
