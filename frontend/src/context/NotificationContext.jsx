import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'success', title = '', message = '', duration = 4000 }) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = (message, title = 'تم بنجاح') => showToast({ type: 'success', title, message });
  const error = (message, title = 'خطأ في العملية') => showToast({ type: 'error', title, message, duration: 6000 });
  const warning = (message, title = 'تنبيه') => showToast({ type: 'warning', title, message });
  const info = (message, title = 'معلومة') => showToast({ type: 'info', title, message });

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={20} color="var(--success)" />;
      case 'error': return <AlertCircle size={20} color="var(--danger)" />;
      case 'warning': return <AlertTriangle size={20} color="var(--warning)" />;
      default: return <Info size={20} color="var(--info)" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {getIcon(t.type)}
            </div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px' }}
              aria-label="إغلاق التنبيه"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within a NotificationProvider');
  return context;
};
