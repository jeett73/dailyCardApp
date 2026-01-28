import { Platform } from 'react-native';
import { showError } from './toastService';

export type ErrorEntry = {
  id: string;
  message: string;
  name?: string;
  stack?: string;
  source?: string;
  isFatal?: boolean;
  createdAt: number;
  raw?: unknown;
};

type ErrorListener = (errors: ErrorEntry[]) => void;

const listeners = new Set<ErrorListener>();
const errors: ErrorEntry[] = [];
let installed = false;

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shouldToastForCustomerMutation(err: unknown) {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as any;
  const method = String(anyErr?.config?.method ?? '').toLowerCase();
  const url = String(anyErr?.config?.url ?? '');
  if (!method || !url) return false;

  if (method === 'post' && url.includes('/customers/add')) return true;
  if (method === 'put' && /\/customers\/[^/?#]+\/?$/.test(url) && !url.includes('/customers/add'))
    return true;

  return false;
}

function extractMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;

  const anyErr = err as any;

  const axiosMsg =
    anyErr?.response?.data?.message || anyErr?.response?.data?.error || anyErr?.response?.data?.msg;
  if (typeof axiosMsg === 'string' && axiosMsg.trim()) return axiosMsg;

  const msg = anyErr?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;

  try {
    const json = JSON.stringify(err);
    if (json && json !== '{}' && json !== 'null') return json;
  } catch {
    // ignore
  }

  return 'Unknown error';
}

function extractName(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const name = (err as any)?.name;
  return typeof name === 'string' ? name : undefined;
}

function extractStack(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const stack = (err as any)?.stack;
  return typeof stack === 'string' ? stack : undefined;
}

function emit() {
  const snapshot = [...errors];
  for (const l of listeners) {
    l(snapshot);
  }
}

export function subscribeToErrors(listener: ErrorListener) {
  listeners.add(listener);
  listener([...errors]);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllErrors() {
  return [...errors];
}

export function clearErrors() {
  errors.splice(0, errors.length);
  emit();
}

export function reportError(
  err: unknown,
  opts?: { source?: string; userMessage?: string; isFatal?: boolean; toast?: boolean },
) {
  const entry: ErrorEntry = {
    id: createId(),
    message: extractMessage(err),
    name: extractName(err),
    stack: extractStack(err),
    source: opts?.source,
    isFatal: opts?.isFatal,
    createdAt: Date.now(),
    raw: err,
  };

  errors.unshift(entry);
  if (errors.length > 100) {
    errors.splice(100);
  }

  emit();

  if (opts?.toast !== false) {
    if (shouldToastForCustomerMutation(err)) {
      showError(opts?.userMessage || entry.message);
    }
  }

  return entry;
}

export function installGlobalErrorHandler() {
  if (installed) return;
  installed = true;

  const ErrorUtils = (global as any)?.ErrorUtils;
  const prevHandler =
    typeof ErrorUtils?.getGlobalHandler === 'function' ? ErrorUtils.getGlobalHandler() : null;

  if (typeof ErrorUtils?.setGlobalHandler === 'function') {
    ErrorUtils.setGlobalHandler((e: unknown, isFatal?: boolean) => {
      reportError(e, { source: 'global', isFatal, toast: true });
      if (typeof prevHandler === 'function') {
        prevHandler(e, isFatal);
      }
    });
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      reportError(event.error || event.message, { source: 'window.error', toast: true });
    });
    window.addEventListener('unhandledrejection', (event) => {
      reportError((event as any).reason, { source: 'window.unhandledrejection', toast: true });
    });
  }
}
