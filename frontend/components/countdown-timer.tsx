'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface CountdownTimerProps {
  /** Target date/time (ISO string or Date) */
  targetDate: string | Date;
  /** Callback fired when countdown reaches zero */
  onExpire?: () => void;
  /** Label shown before the timer */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show as inline text or as a card */
  variant?: 'inline' | 'card';
  /** Optional className */
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Issue #451 — Countdown timer component for expiration windows.
 *
 * Displays a live countdown to a target date, with automatic expiry
 * callback and accessible status announcements.
 */
export function CountdownTimer({
  targetDate,
  onExpire,
  label = 'Expires in',
  size = 'md',
  variant = 'inline',
  className = '',
}: CountdownTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  const calculateTimeLeft = useCallback((): TimeLeft | null => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [target]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft);

  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      const next = calculateTimeLeft();
      if (!next) {
        clearInterval(timer);
        setTimeLeft(null);
        onExpire?.();
      } else {
        setTimeLeft(next);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onExpire, timeLeft]);

  if (!timeLeft) {
    return (
      <span
        className={`text-red-600 dark:text-red-400 ${sizeClasses[size]} ${className}`}
        role="timer"
        aria-live="polite"
      >
        Expired
      </span>
    );
  }

  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
  parts.push(`${timeLeft.minutes}m`);
  parts.push(`${timeLeft.seconds}s`);
  const timeStr = parts.join(' ');

  const urgent = timeLeft.days === 0 && timeLeft.hours < 1;

  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border p-4 ${
          urgent
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
        } ${className}`}
        role="timer"
        aria-live="polite"
        aria-label={`${label} ${timeStr}`}
      >
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={`font-mono font-bold ${
            urgent
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-100'
          } ${sizeClasses[size]}`}
        >
          {timeStr}
        </p>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono ${
        urgent
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-700 dark:text-slate-300'
      } ${sizeClasses[size]} ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`${label} ${timeStr}`}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{label}:</span>
      <span className="font-semibold">{timeStr}</span>
    </span>
  );
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
};
