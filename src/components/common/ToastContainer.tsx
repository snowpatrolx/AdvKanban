import { useToastStore } from './Toast';
import './Toast.css';

export default function ToastContainer() {
  const { toasts } = useToastStore();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast-item">
          <span className="toast-icon">{t.icon}</span>
          <div className="toast-text">
            <div className="toast-title">{t.title}</div>
            {t.subtitle && <div className="toast-subtitle">{t.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
