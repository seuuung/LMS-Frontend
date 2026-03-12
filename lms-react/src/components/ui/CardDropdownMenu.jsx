/**
 * CardDropdownMenu.jsx
 * 
 * 클래스 카드 우측 상단의 점 세개(⋮) 드롭다운 메뉴 컴포넌트
 * 어드민/교수 페이지에서 재사용됩니다.
 * 
 * @param {boolean} isOpen - 메뉴 열림 여부
 * @param {Function} onToggle - 메뉴 토글 핸들러
 * @param {Array<{label: string, onClick: Function, danger?: boolean}>} items - 메뉴 항목 배열
 */
export default function CardDropdownMenu({ isOpen, onToggle, items = [] }) {
    return (
        <>
            {/* 햄버거(점 세개) 버튼 */}
            <button
                className="class-card-menu-btn"
                style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(255, 255, 255, 0.9)', border: 'none',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', color: '#334155', cursor: 'pointer',
                    zIndex: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
                &#8942;
            </button>

            {/* 드롭다운 패널 */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '3.5rem', right: '1rem',
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    zIndex: 10, minWidth: '120px', overflow: 'hidden'
                }}>
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            style={{
                                display: 'block', width: '100%', padding: '0.75rem 1rem',
                                textAlign: 'left', background: 'none', border: 'none',
                                borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                                cursor: 'pointer', fontSize: '0.9rem',
                                color: item.danger ? '#ef4444' : '#334155'
                            }}
                            onClick={(e) => { e.stopPropagation(); item.onClick(); }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
