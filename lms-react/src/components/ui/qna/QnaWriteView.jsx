import React, { useState } from 'react';

/**
 * QnA 글쓰기 뷰 (카드 섹션 전체 사용)
 */
export default function QnaWriteView({ currentUser, onSubmit, onCancel }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    /**
     * 질문 등록 제출 핸들러
     * 제목과 내용이 모두 입력된 경우에만 부모의 onSubmit을 호출합니다.
     */
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
                        🔒 비공개 (교수자만 볼 수 있음)
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
