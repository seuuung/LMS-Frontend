'use client';

import { useState, useEffect } from 'react';

/**
 * 전역 화면 블로킹 로딩 스피너 컴포넌트
 * `api-load-start`, `api-load-end` 전역 커스텀 이벤트를 리스닝하여 동작합니다.
 * API 호출 횟수(loadingCount)를 카운팅하여 다중 API 호출 시에도 스피너가 유지되도록 처리합니다.
 *
 * @returns {JSX.Element|null} 카운트가 0 초과일 때만 화면 렌더링
 */
export default function LoadingSpinner() {
    // 활성화된(처리 중인) API의 개수를 관리
    const [loadingCount, setLoadingCount] = useState(0);

    useEffect(() => {
        const handleStart = () => setLoadingCount(prev => prev + 1);
        const handleEnd = () => setLoadingCount(prev => Math.max(0, prev - 1));

        window.addEventListener('api-load-start', handleStart);
        window.addEventListener('api-load-end', handleEnd);

        return () => {
            window.removeEventListener('api-load-start', handleStart);
            window.removeEventListener('api-load-end', handleEnd);
        };
    }, []);

    if (loadingCount === 0) return null;

    return (
        <div
            id="global-loading"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999,
            }}
        >
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid var(--border-color, #e2e8f0)',
                    borderTop: '4px solid var(--primary-color, #2563eb)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            ></div>
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
