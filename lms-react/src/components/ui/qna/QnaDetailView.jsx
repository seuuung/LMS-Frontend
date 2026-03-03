import React, { useState } from 'react';

/**
 * QnA 상세 보기 뷰
 * 카드 섹션 전체를 하나의 게시물 상세 화면으로 전환합니다.
 */
export default function QnaDetailView({ qna, authorName, allUsers, currentUser, onDelete, onAddReply, onDeleteReply, onBack }) {
    const [replyContent, setReplyContent] = useState('');

    /**
     * 답변 등록 핸들러
     * 입력값이 비어있지 않은 경우에만 부모로부터 전달받은 onAddReply를 호출합니다.
     */
    const handleReplySubmit = () => {
        if (!replyContent.trim()) return;
        onAddReply(qna.id, currentUser.id, replyContent);
        setReplyContent('');
    };

    // 삭제 권한: 작성자 본인이거나 관리자(admin)인 경우 허용
    const canDelete = qna.authorId === currentUser?.id || currentUser?.role === 'admin';

    return (
        <div className="qna-detail-view">
            {/* 상단: 목록으로 돌아가기 */}
            <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                ← 목록으로 돌아가기
            </button>

            {/* 게시글 헤더 */}
            <div className="qna-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>{qna.title}</h3>
                    {qna.isPrivate && (
                        <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600 }}>
                            🔒 비공개
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <span className="meta" style={{ fontSize: '0.9rem' }}>작성자: {authorName}</span>
                    <span className="meta" style={{ fontSize: '0.9rem' }}>|</span>
                    <span className="meta" style={{ fontSize: '0.9rem' }}>{new Date(qna.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.85rem', color: qna.replies?.length > 0 ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                        {qna.replies?.length > 0 ? `답변 ${qna.replies.length}개` : '답변 대기중'}
                    </span>
                </div>
                {canDelete && (
                    <button
                        className="action-btn del"
                        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
                        onClick={() => { onDelete(qna.id); onBack(); }}
                    >
                        게시글 삭제
                    </button>
                )}
            </div>

            {/* 게시글 본문 */}
            <div className="qna-detail-content">
                {qna.content}
            </div>

            {/* 구분선 */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

            {/* 답변 영역 */}
            <div className="qna-detail-replies">
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>
                    💬 답변 ({qna.replies?.length || 0})
                </h4>

                {!qna.replies || qna.replies.length === 0 ? (
                    <p style={{ fontSize: '0.95rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem 0' }}>
                        아직 등록된 답변이 없습니다.
                    </p>
                ) : (
                    qna.replies.map(reply => {
                        const rAuthor = allUsers.find(u => u.id === reply.authorId);
                        const rAuthorName = rAuthor ? rAuthor.name : reply.authorId;
                        const roleLabel = rAuthor?.role === 'admin' ? '관리자' : rAuthor?.role === 'prof' ? '교수자' : '';
                        return (
                            <div key={reply.id} className="reply-item">
                                <div className="reply-header">
                                    <span className="reply-author">
                                        {rAuthorName}
                                        {roleLabel && <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>({roleLabel})</span>}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                        {(reply.authorId === currentUser?.id || currentUser?.role === 'admin') && (
                                            <button
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                                                onClick={() => onDeleteReply(qna.id, reply.id)}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="reply-content">
                                    {reply.content}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* 교수 또는 관리자만 답변 폼 표시 */}
                {(currentUser?.role === 'prof' || currentUser?.role === 'admin') && (
                    <div className="reply-form-wrapper" style={{ marginTop: '1.5rem' }}>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>답변 작성</h5>
                        <textarea
                            className="form-control"
                            placeholder="학생의 질문에 대한 답변을 작성해주세요..."
                            rows={4}
                            style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        ></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={handleReplySubmit} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                                답변 등록
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
