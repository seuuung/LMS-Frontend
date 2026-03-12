import React from 'react';

/**
 * 공통 기능 버튼 컴포넌트
 * 영상 보기, 수강률 통계, 로그 보기, 삭제 등 동일한 기능군 버튼 디자인을 통일합니다.
 * 
 * @param {string} variant - 버튼 스타일 종류 ('primary', 'secondary', 'danger', 'outline')
 * @param {function} onClick - 클릭 핸들러
 * @param {React.ReactNode} children - 버튼 내용 텍스트
 * @param {Object} [style] - 추가 커스텀 인라인 스타일
 * @param {string} [className] - 추가 클래스
 */
export default function ActionButton({ variant = 'secondary', onClick, children, style = {}, className = '' }) {
    // 기본 버튼 스타일 (강의 목록 스크린샷 2번째 사진 기준 통일)
    const baseStyle = {
        padding: '0.3rem 0.6rem',
        fontSize: '0.8rem',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
        ...style
    };

    // Variant 별 배경색과 글자색 매핑
    const variantStyles = {
        // 수강률 통계, 영상 보기 등 (하늘색 계열)
        primary: {
            background: '#eff6ff',
            color: '#3b82f6',
        },
        // 영상 보기 (회색 계열)
        secondary: {
            background: '#e2e8f0',
            color: '#0f172a',
        },
        // 로그 보기 (연한 회색 테두리)
        outline: {
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1'
        },
        // 삭제 (연한 빨간색)
        danger: {
            background: '#fee2e2',
            color: '#ef4444',
        }
    };

    const currentStyle = { ...baseStyle, ...variantStyles[variant] };

    // className이 넘겨진 경우 합치기 (예: action-btn del 처럼 기존 클래스가 있을 때)
    return (
        <button
            className={`btn ${className}`}
            style={currentStyle}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
