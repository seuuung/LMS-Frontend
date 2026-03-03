'use client';

import { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000); // 3초 뒤 삭제
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Render Area */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 9999,
                }}
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            padding: '15px 25px',
                            backgroundColor:
                                toast.type === 'error'
                                    ? 'var(--danger-color, #ef4444)'
                                    : toast.type === 'success'
                                        ? 'var(--success-color, #22c55e)'
                                        : 'var(--card-bg, #ffffff)',
                            color: toast.type === 'info' ? 'var(--text-main, #0f172a)' : '#fff',
                            boxShadow: 'var(--shadow-lg, 0 10px 15px rgba(0,0,0,0.1))',
                            borderRadius: 'var(--radius-md, 0.5rem)',
                            animation: 'fadein 0.3s ease-in-out',
                        }}
                    >
                        {toast.message}
                    </div>
                ))}
                <style jsx>{`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
            </div>
        </ToastContext.Provider>
    );
}
