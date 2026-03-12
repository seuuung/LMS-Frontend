'use client';

import { createContext, useState, useCallback } from 'react';

export const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '확인',
        confirmBtnClass: 'btn-delete',
        resolve: null,
    });

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                message,
                title: options.title || '확인',
                confirmText: options.confirmText || '확인',
                confirmBtnClass: options.confirmBtnClass || 'btn-delete',
                resolve,
            });
        });
    }, []);

    const handleClose = (result) => {
        setModalState((prev) => {
            if (prev.resolve) prev.resolve(result);
            return { ...prev, isOpen: false };
        });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {modalState.isOpen && (
                <div
                    className="custom-modal-overlay"
                    style={{ opacity: 1 }}
                    onClick={(e) => {
                        if (e.target.className === 'custom-modal-overlay') {
                            handleClose(false);
                        }
                    }}
                >
                    <div className="custom-modal" style={{ transform: 'translateY(0)' }}>
                        <h3>{modalState.title}</h3>
                        <p>{modalState.message}</p>
                        <div className="custom-modal-actions">
                            <button
                                className="btn btn-cancel"
                                onClick={() => handleClose(false)}
                            >
                                취소
                            </button>
                            <button
                                className={`btn ${modalState.confirmBtnClass}`}
                                onClick={() => handleClose(true)}
                            >
                                {modalState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
