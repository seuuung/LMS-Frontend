'use client';

import { useState } from 'react';

/**
 * 자료 등록 인라인 폼 컴포넌트 (관리자/교수자 공용)
 * 자료 제목, 설명, 파일 첨부 입력을 받아 등록 처리합니다.
 * 
 * @param {function({title: string, desc: string, file: File}): void} onSubmit - 등록 핸들러 (제목, 설명, 파일을 객체로 전달 받음)
 * @param {function(): void} onCancel - 작성 취소 버튼 핸들러
 * @returns {JSX.Element}
 */
export default function ResourceForm({ onSubmit, onCancel }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [file, setFile] = useState(null);

    const handleSubmit = () => {
        onSubmit({ title, desc, file });
    };

    const handleCancel = () => {
        setTitle('');
        setDesc('');
        setFile(null);
        onCancel();
    };

    return (
        <div style={{ marginTop: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
            <div className="form-group">
                <label className="form-label">자료 제목</label>
                <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">자료 설명</label>
                <input type="text" className="form-control" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">파일 첨부</label>
                <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handleSubmit}>등록</button>
                <button className="btn btn-cancel" onClick={handleCancel}>취소</button>
            </div>
        </div>
    );
}
