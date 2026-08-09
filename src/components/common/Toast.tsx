import { create } from 'zustand';

export interface ToastItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));
