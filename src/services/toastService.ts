export type ToastType = 'info' | 'success' | 'error';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  durationMs: number;
  createdAt: number;
};

type ToastListener = (toast: ToastItem) => void;

const listeners = new Set<ToastListener>();

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(type: ToastType, message: string, durationMs?: number) {
  const toast: ToastItem = {
    id: createId(),
    type,
    message,
    durationMs: durationMs ?? (type === 'error' ? 4500 : 2200),
    createdAt: Date.now(),
  };

  for (const l of listeners) {
    l(toast);
  }

  return toast.id;
}

export function showInfo(message: string, durationMs?: number) {
  return showToast('info', message, durationMs);
}

export function showSuccess(message: string, durationMs?: number) {
  return showToast('success', message, durationMs);
}

export function showError(message: string, durationMs?: number) {
  return showToast('error', message, durationMs);
}
