/**
 * Icons.jsx
 * 
 * 공통 SVG 아이콘 컴포넌트 모음
 * 카드, 리스트 등 여러 곳에서 재사용되는 아이콘을 한곳에서 관리합니다.
 */

/** 펼쳐진 책 아이콘 (클래스 카드 플레이스홀더) */
export function BookIcon({ size = 24, ...props }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} {...props}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            <path d="M6 8h2" /><path d="M6 12h2" />
            <path d="M16 8h2" /><path d="M16 12h2" />
        </svg>
    );
}

/** 교수 아이콘 (담당교수 표시용) */
export function ProfessorIcon({ size = 16, ...props }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
