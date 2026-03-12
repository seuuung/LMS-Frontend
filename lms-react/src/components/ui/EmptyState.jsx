/**
 * 빈 목록 상태를 표시하는 텍스트 컴포넌트
 * 테이블이나 리스트에서 렌더링할 데이터가 없을 때 일관된 안내 메시지를 표시합니다.
 *
 * @param {Object} props
 * @param {string} props.message - 화면에 출력할 안내 메시지 문자열
 * @returns {JSX.Element}
 */
export default function EmptyState({ message }) {
    return (
        <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            {message}
        </p>
    );
}
