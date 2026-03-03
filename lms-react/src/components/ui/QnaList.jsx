import React, { useState } from 'react';
import EmptyState from './EmptyState';

/**
 * QnA 글쓰기 뷰 (카드 섹션 전체 사용)
 */
function QnaWriteView({ currentUser, onSubmit, onCancel }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;
        onSubmit(title, content, isPrivate);
    };

    return (
        <div className="qna-detail-view">
            <button className="btn btn-secondary" onClick={onCancel} style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                ← 목록으로 돌아가기
            </button>

            <div className="qna-detail-header">
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>새 질문 작성</h3>
            </div>

            <div style={{ paddingTop: '1.5rem' }}>
                <input
                    type="text"
                    className="form-control mb-4"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ fontSize: '1.05rem' }}
                />
                <textarea
                    className="form-control mb-4"
                    placeholder="내용을 입력하세요"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ fontSize: '1rem', lineHeight: '1.7' }}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#64748b', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                        🔒 비공개 (교수자와 관리자만 볼 수 있음)
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" onClick={onCancel}>취소</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>등록</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * QnA 상세 보기 뷰
 * 카드 섹션 전체를 하나의 게시물 상세 화면으로 전환합니다.
 */
function QnaDetailView({ qna, authorName, allUsers, currentUser, onDelete, onAddReply, onDeleteReply, onBack }) {
    const [replyContent, setReplyContent] = useState('');

    const handleReplySubmit = () => {
        if (!replyContent.trim()) return;
        onAddReply(qna.id, currentUser.id, replyContent);
        setReplyContent('');
    };

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

/**
 * QnA 목록 컴포넌트
 * 3가지 모드를 관리합니다: 목록 / 상세 보기 / 글쓰기
 * 글쓰기와 상세 보기 모드에서는 카드 섹션 전체를 사용하며, 글쓰기 버튼이 숨겨집니다.
 * 
 * @param {Array<Object>} qnas - QnA 게시물 데이터 배열
 * @param {Array<Object>} allUsers - 전체 사용자 목록 객체 배열
 * @param {Object} currentUser - 현재 접속한 사용자
 * @param {function} onDelete - 게시글 삭제 핸들러
 * @param {function} onAddReply - 답변 추가 핸들러
 * @param {function} onDeleteReply - 답변 삭제 핸들러
 * @param {function} onCreateQna - 새 게시글 작성 핸들러 (title, content, isPrivate)
 */
export default function QnaList({ qnas, allUsers, currentUser, onDelete, onAddReply, onDeleteReply, onCreateQna }) {
    // 모드: 'list' | 'detail' | 'write'
    const [mode, setMode] = useState('list');
    const [selectedQnaId, setSelectedQnaId] = useState(null);

    // 비공개 접근 권한 확인: 본인 글이거나 교수/관리자인 경우만 조회 가능
    const canViewPrivate = (q) => {
        if (!q.isPrivate) return true;
        if (currentUser?.role === 'prof' || currentUser?.role === 'admin') return true;
        if (q.authorId === currentUser?.id) return true;
        return false;
    };

    // 글쓰기 모드
    if (mode === 'write') {
        return (
            <QnaWriteView
                currentUser={currentUser}
                onSubmit={(title, content, isPrivate) => {
                    onCreateQna(title, content, isPrivate);
                    setMode('list');
                }}
                onCancel={() => setMode('list')}
            />
        );
    }

    // 상세 보기 모드
    const selectedQna = qnas.find(q => q.id === selectedQnaId);
    if (mode === 'detail' && selectedQna) {
        const author = allUsers.find(u => u.id === selectedQna.authorId);
        const authorName = author ? author.name : selectedQna.authorId;
        return (
            <QnaDetailView
                qna={selectedQna}
                authorName={authorName}
                allUsers={allUsers}
                currentUser={currentUser}
                onDelete={onDelete}
                onAddReply={onAddReply}
                onDeleteReply={onDeleteReply}
                onBack={() => { setMode('list'); setSelectedQnaId(null); }}
            />
        );
    }

    // 목록 모드
    const sortedQnas = [...qnas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>QnA 게시판</h4>
                <button className="btn btn-primary" onClick={() => setMode('write')} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                    글쓰기
                </button>
            </div>
            <div className="list-container mb-4" style={{ marginTop: '0' }}>
                {sortedQnas.length === 0 ? (
                    <EmptyState message="QnA 게시글이 없습니다." />
                ) : (
                    sortedQnas.map(q => {
                        const accessible = canViewPrivate(q);
                        const author = allUsers.find(u => u.id === q.authorId);
                        const authorName = author ? author.name : q.authorId;
                        return (
                            <div
                                className="qna-card"
                                key={q.id}
                                onClick={() => {
                                    if (!accessible) return;
                                    setSelectedQnaId(q.id);
                                    setMode('detail');
                                }}
                                style={{
                                    cursor: accessible ? 'pointer' : 'default',
                                    opacity: accessible ? 1 : 0.65,
                                }}
                            >
                                <div className="qna-header">
                                    <div className="qna-header-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <strong>{q.title}</strong>
                                            {q.isPrivate && (
                                                <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                                                    🔒 비공개
                                                </span>
                                            )}
                                        </div>
                                        <span className="meta">작성자: {authorName} | {new Date(q.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: q.replies?.length > 0 ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                                            {q.replies?.length > 0 ? `답변 ${q.replies.length}개` : '답변 대기중'}
                                        </span>
                                        {accessible ? (
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>보기 →</span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>조회 불가</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

