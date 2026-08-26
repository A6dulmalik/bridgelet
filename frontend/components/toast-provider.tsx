'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ToastNotification, type ToastVariant } from './toast-notification';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastContextValue = {
  showToast: (
    message: string,
    variant?: ToastVariant,
    options?: { action?: Toast['action']; duration?: number },
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      options?: { action?: Toast['action']; duration?: number },
    ) => {
      const id = `toast-${++nextId}`;
      const duration = options?.duration ?? 5000;
      setToasts((prev) => [...prev, { id, message, variant, action: options?.action, duration }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastNotification
              message={toast.message}
              variant={toast.variant}
              onDismiss={() => removeToast(toast.id)}
              action={toast.action}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
