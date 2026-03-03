import EmptyState from './EmptyState';

/**
 * QnA 목록 컴포넌트 (관리자/교수자 공용)
 * QnA 목록을 표시하고 삭제 기능을 제공합니다.
 * 
 * @param {Array<Object>} qnas - QnA 게시물 데이터 배열
 * @param {Array<Object>} allUsers - 전체 사용자 목록 객체 배열 (작성자 이름 조회용)
 * @param {function(string): void} onDelete - 삭제 핸들러 콜백 (qnaId를 인자로 전달)
 * @returns {JSX.Element}
 */
export default function QnaList({ qnas, allUsers, onDelete }) {
    return (
        <div className="list-container mb-4">
            {qnas.length === 0 ? (
                <EmptyState message="QnA 내역이 없습니다." />
            ) : (
                qnas.map(q => {
                    const author = allUsers.find(u => u.id === q.authorId);
                    const authorName = author ? author.name : q.authorId;
                    return (
                        <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }} key={q.id}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ marginBottom: '0.5rem' }}>{q.title} <small>({authorName})</small></strong>
                                <button className="action-btn del" onClick={() => onDelete(q.id)}>삭제</button>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>{q.content}</p>
                        </div>
                    );
                })
            )}
        </div>
    );
}
