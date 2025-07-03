import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  Bell,
  AlertTriangle
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'notification';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  toasts, 
  onRemove, 
  position = 'top-right' 
}) => {
  
  const getIcon = (type: ToastMessage['type']) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color="#10b981" />;
      case 'error':
        return <AlertCircle {...iconProps} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle {...iconProps} color="#f59e0b" />;
      case 'notification':
        return <Bell {...iconProps} color="#3b82f6" />;
      default:
        return <Info {...iconProps} color="#6b7280" />;
    }
  };

  const getColors = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return {
          background: '#f0fdf4',
          border: '#bbf7d0',
          text: '#166534',
          accent: '#10b981'
        };
      case 'error':
        return {
          background: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          accent: '#ef4444'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          border: '#fed7aa',
          text: '#92400e',
          accent: '#f59e0b'
        };
      case 'notification':
        return {
          background: '#eff6ff',
          border: '#bfdbfe',
          text: '#1e40af',
          accent: '#3b82f6'
        };
      default:
        return {
          background: '#f9fafb',
          border: '#d1d5db',
          text: '#374151',
          accent: '#6b7280'
        };
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      padding: '20px',
      pointerEvents: 'none' as const
    };

    switch (position) {
      case 'top-right':
        return { ...base, top: 0, right: 0 };
      case 'top-left':
        return { ...base, top: 0, left: 0 };
      case 'bottom-right':
        return { ...base, bottom: 0, right: 0 };
      case 'bottom-left':
        return { ...base, bottom: 0, left: 0 };
      case 'top-center':
        return { ...base, top: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center':
        return { ...base, bottom: 0, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...base, top: 0, right: 0 };
    }
  };

  return (
    <div style={getPositionStyles()}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const colors = getColors(toast.type);
          
          return (
            <motion.div
              key={toast.id}
              initial={{
                opacity: 0,
                scale: 0.8,
                x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
                y: position.includes('top') ? -50 : position.includes('bottom') ? 50 : 0
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 40
              }}
              style={{
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '320px',
                maxWidth: '400px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
                pointerEvents: 'auto',
                position: 'relative',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Progress bar for auto-dismiss */}
              {toast.duration && toast.duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    background: colors.accent,
                    borderRadius: '0 0 12px 12px'
                  }}
                />
              )}

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {/* Icon */}
                <div style={{
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {getIcon(toast.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: toast.message ? '4px' : '0'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      lineHeight: '1.3'
                    }}>
                      {toast.title}
                    </h4>

                    <motion.button
                      onClick={() => onRemove(toast.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: colors.text,
                        opacity: 0.7,
                        marginLeft: '8px',
                        flexShrink: 0
                      }}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>

                  {toast.message && (
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '13px',
                      color: colors.text,
                      opacity: 0.8,
                      lineHeight: '1.4'
                    }}>
                      {toast.message}
                    </p>
                  )}

                  {toast.action && (
                    <motion.button
                      onClick={toast.action.onClick}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: colors.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      {toast.action.label}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook для управления toast уведомлениями
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      duration: 5000, // 5 секунд по умолчанию
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove после duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Convenience methods
  const success = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'success', title, message, ...options });
  };

  const error = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'error', title, message, duration: 8000, ...options });
  };

  const warning = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'warning', title, message, duration: 6000, ...options });
  };

  const info = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'info', title, message, ...options });
  };

  const notification = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'notification', title, message, duration: 7000, ...options });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    notification
  };
};

export default ToastNotification; 