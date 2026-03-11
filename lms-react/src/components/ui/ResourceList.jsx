import EmptyState from './EmptyState';

/**
 * 자료 목록 컴포넌트 (관리자/교수자/학생 공용)
 * 자료 목록을 표시하고, 역할에 따라 삭제 또는 다운로드 버튼을 제공합니다.
 * 
 * @param {Array<Object>} resources - 학습 자료 객체 데이터 배열
 * @param {function(string): void} [onDelete] - 자원 삭제 핸들러 (관리자/교수자 전용, 선택적 부여)
 * @param {function(Object): void} [onDownload] - 파일 다운로드 핸들러 (학생 전용, 선택적 부여)
 * @returns {JSX.Element}
 */
export default function ResourceList({ resources, onDelete, onDownload }) {
    return (
        <div className="list-container mt-4">
            {resources.length === 0 ? (
                <EmptyState message="등록된 자료가 없습니다." />
            ) : (
                resources.map(r => (
                    <div className="list-item" key={r.id}>
                        <span style={{ flex: 1, marginRight: '1rem' }}>{r.title} <small>({r.filename})</small></span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* 관리자/교수자 권한이 있는 경우에만 삭제 버튼 노출 */}
                            {onDelete && (
                                <button className="action-btn del" onClick={() => onDelete(r.id)}>삭제</button>
                            )}
                            {/* 학생 권한(다운로드 핸들러 전달됨)이 있는 경우에만 다운로드 버튼 노출 */}
                            {onDownload && (
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                                    onClick={() => onDownload(r)}
                                >
                                    다운로드
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
