import React, { useEffect } from 'react';

/**
 * 전역 모달(Modal) 컴포넌트
 * 반투명 오버레이와 컨텐츠 영역을 활성화하는 역할을 수행합니다.
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 출력 여부
 * @param {Function} props.onClose - 모달 닫힘 제어 함수
 * @param {string} props.title - 모달 헤더 제목
 * @param {React.ReactNode} props.children - 내부 입력 요소
 */
export default function Modal({ isOpen, onClose, title, children }) {
    // 모달 활성화 시 뒷 배경 스크롤 방지
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true">
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>{title}</h3>
                    <button style={closeBtnStyle} onClick={onClose} aria-label="닫기">
                        &times;
                    </button>
                </div>
                <div style={contentStyle}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// Inline Styles for Modal
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
};

const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '500px',
    margin: '0 20px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
};

const headerStyle = {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const closeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.2rem 0.5rem',
    lineHeight: '1',
    borderRadius: '4px',
};

const contentStyle = {
    padding: '1.5rem',
    overflowY: 'auto',
};
