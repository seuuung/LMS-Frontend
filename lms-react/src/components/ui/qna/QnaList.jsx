import React, { useState } from 'react';
import EmptyState from '../EmptyState';
import QnaWriteView from './QnaWriteView';
import QnaDetailView from './QnaDetailView';

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
    // 모드 상태 관리: 'list' (목록), 'detail' (상세), 'write' (글쓰기)
    const [mode, setMode] = useState('list');
    // 상세 보기 시 선택된 게시글의 ID
    const [selectedQnaId, setSelectedQnaId] = useState(null);

    // 비공개 접근 권한 확인: 본인 글이거나 교수/관리자인 경우만 조회 가능
    const canViewPrivate = (q) => {
        if (!q.isPrivate) return true;
        if (currentUser?.role === 'prof' || currentUser?.role === 'admin') return true;
        if (q.authorId === currentUser?.userId) return true;
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
        const author = allUsers.find(u => u.userId === selectedQna.authorId);
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
                        const author = allUsers.find(u => u.userId === q.authorId);
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

