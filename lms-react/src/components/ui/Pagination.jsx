import React from 'react';

/**
 * 공통 페이지네이션 컴포넌트
 * 
 * 어드민 페이지의 사용자(User) 관리, 클래스(Class) 목록 뿐만 아니라 
 * 모달 창 내부의 로그 상세보기(ActivityLogModal) 등 여러 화면에서 중복되는 
 * 이전/다음 페이지 이동 UI를 통합 제공합니다.
 * 
 * @param {Object} props
 * @param {number} props.currentPage - 현재 페이지 번호
 * @param {number} props.totalPages - 전체 페이지 수
 * @param {Function} props.onPrev - '이전' 버튼 클릭 핸들러
 * @param {Function} props.onNext - '다음' 버튼 클릭 핸들러
 * @param {Function} props.onPageChange - 페이지 번호 클릭 시 이동 핸들러
 * @param {Object} [props.style] - 최상위 div 컨테이너에 적용할 추가 인라인 스타일
 * @returns {JSX.Element|null} 전체 페이지가 1 이하일 경우 null 반환
 */
export default function Pagination({ currentPage, totalPages, onPrev, onNext, onPageChange, style }) {
    if (totalPages <= 1) return null;

    // 최대 5개의 페이지 번호를 표시
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', ...style }}>
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                style={{
                    padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                    color: '#334155', borderRadius: '4px', fontWeight: '500', fontSize: '0.9rem',
                    opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
            >
                이전
            </button>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange && onPageChange(page)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            border: page === currentPage ? '1px solid var(--primary-color)' : '1px solid #cbd5e1',
                            backgroundColor: page === currentPage ? 'var(--primary-color)' : '#ffffff',
                            color: page === currentPage ? '#ffffff' : '#334155',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '2.5rem'
                        }}
                    >
                        {page}
                    </button>
                ))}
            </div>
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                style={{
                    padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                    color: '#334155', borderRadius: '4px', fontWeight: '500', fontSize: '0.9rem',
                    opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
            >
                다음
            </button>
        </div>
    );
}
