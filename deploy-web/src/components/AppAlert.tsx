// WEB ONLY — deploy-web/src/components/AppAlert.tsx
import { useEffect, useState } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AppAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  onDismiss?: () => void;
  duration?: number;
}

const typeStyles: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'check_circle',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'error',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'warning',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'info',
  },
};

export function AppAlert({ visible, title, message, type = 'info', onDismiss, duration }: AppAlertProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!duration || !isVisible) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, isVisible, onDismiss]);

  if (!isVisible) return null;

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 transition-opacity duration-200">
      <div
        className={[
          'w-full max-w-sm rounded-xl border p-5 shadow-lg',
          styles.bg,
          styles.border,
          styles.text,
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-xl">{styles.icon}</span>
          <div className="flex-1">
            {title ? <h3 className="font-semibold">{title}</h3> : null}
            <p className={title ? 'mt-1 text-sm' : 'text-sm'}>{message}</p>
          </div>
          {onDismiss ? (
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="text-on-surface-variant hover:text-on-surface"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
