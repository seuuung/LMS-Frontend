'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/api';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { extractVideoId } from '@/lib/utils';

/**
 * 강의 업로드 공통 컴포넌트
 * 관리자/교수자가 공유하는 강의 업로드 폼으로,
 * 유튜브 링크 연동, 미리보기, 자료 첨부 기능을 제공합니다.
 * 교수자 레이아웃을 기준으로 구성: 사이드바 네비게이션 + 카드 내부에 폼/미리보기
 *
 * @param {string} classId - 강의를 등록할 클래스 ID
 * @param {Array<string>} allowedRoles - 접근 허용 역할
 * @param {string} basePath - 역할별 기본 경로 (예: '/admin', '/professor')
 */
export default function UploadForm({ classId, allowedRoles, basePath }) {
    const { requireAuth, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [currentClass, setCurrentClass] = useState(null);

    // 폼 입력 상태
    const [lecTitle, setLecTitle] = useState('');
    const [lecDesc, setLecDesc] = useState('');
    const [lecLink, setLecLink] = useState('');
    const [resFile, setResFile] = useState(null);
    const [previewId, setPreviewId] = useState('');

    useEffect(() => {
        // 1. 전달받은 allowedRoles를 기반으로 기본적인 페이지 권한 확인
        if (!requireAuth(allowedRoles)) return;
        if (!classId) return;

        // 2. 클래스 정보를 가져와 실제 해당 클래스의 담당 교수인지(관리자가 아닌 경우) 추가 검증
        api.classes.getById(classId).then(cls => {
            if (!cls || (user.role !== 'admin' && cls.profId !== user.userId)) {
                showToast('해당 클래스에 접근할 권한이 없거나 존재하지 않는 클래스입니다.', 'error');
                router.push(basePath);
                return;
            }
            setCurrentClass(cls);
        });
    }, [user, classId]);

    /** 유튜브 링크 미리보기 */
    const handlePreview = () => {
        if (!lecLink) {
            showToast('유튜브 링크를 입력해주세요.', 'error');
            return;
        }
        const videoId = extractVideoId(lecLink);
        if (videoId) {
            setPreviewId(videoId);
            showToast('영상이 연결되었습니다.', 'success');
        } else {
            showToast('올바른 유튜브 링크가 아닙니다.', 'error');
        }
    };

    /**
     * 강의 및 자료 동시 등록
     * 폼 검증 후 강의를 생성하고, 첨부 파일이 있다면 리소스도 함께 생성합니다.
     */
    const handleCreateLecture = async () => {
        if (!lecTitle.trim()) {
            showToast('강의 제목을 입력하세요.', 'error');
            return;
        }
        if (!lecLink.trim()) {
            showToast('유튜브 강의 링크를 입력하세요.', 'error');
            return;
        }

        try {
            await api.lectures.create(classId, lecTitle.trim(), lecDesc.trim(), lecLink.trim());

            if (resFile) {
                await api.resources.create(classId, `[${lecTitle}] 첨부자료`, lecDesc.trim(), resFile.name);
            }

            showToast('새 강의가 성공적으로 등록되었습니다!', 'success');

            setTimeout(() => {
                router.push(`${basePath}/class/${classId}`);
            }, 1000);

        } catch (err) {
            showToast(err.message || '강의 등록 중 오류가 발생했습니다.', 'error');
        }
    };

    if (!user || !currentClass) return null;

    // 역할별 경로 (더 이상 사이드바 메뉴 렌더링은 불필요하지만 basePath는 계속 사용)
    const isAdmin = basePath === '/admin';

    return (
        <div className="container lecture-layout" style={{ marginTop: '2rem' }}>
            {/* 영상 및 폼 영역 (Main) */}
            <section className="main-lecture">

                <div className="video-wrapper" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {previewId ? (
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${previewId}`} frameBorder="0" allowFullScreen></iframe>
                    ) : (
                        <span style={{ color: '#94a3b8', fontSize: '1rem' }}>유튜브 링크를 입력 후 미리보기를 적용하세요.</span>
                    )}
                </div>

                <div className="lecture-info-panel" style={{ marginTop: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', background: '#fff' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>새 강의 업로드 (유튜브 연동)</h2>

                    <div className="form-group mb-4">
                        <label className="form-label">유튜브 링크</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" className="form-control" placeholder="https://youtu.be/..." value={lecLink} onChange={e => setLecLink(e.target.value)} />
                            <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handlePreview}>미리보기 적용</button>
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">강의 제목</label>
                        <input type="text" className="form-control" placeholder="예: [1주차] LMS 시스템 아키텍처" value={lecTitle} onChange={e => setLecTitle(e.target.value)} />
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">강의 설명 (선택)</label>
                        <textarea className="form-control" placeholder="이 강의에서 다룰 내용을 간략히 적어주세요." style={{ minHeight: '120px' }} value={lecDesc} onChange={e => setLecDesc(e.target.value)}></textarea>
                    </div>
                </div>
            </section>

            {/* 자료 첨부 및 등록 영역 (Sidebar) */}
            <aside className="sidebar">
                <div className="side-card" style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>자료 파일 첨부 (선택)</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        강의 시청 중 학생들이 다운로드할 수 있는 참고 자료를 첨부합니다.
                    </p>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <input type="file" id="resFile" className="form-control" style={{ border: 'none', background: 'transparent', padding: 0 }} onChange={e => setResFile(e.target.files[0])} />
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                            {resFile ? `선택됨: ${resFile.name}` : '선택된 파일 없음'}
                        </div>
                    </div>
                </div>

                <div className="side-card">
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.05rem', padding: '1rem' }} onClick={handleCreateLecture}>
                        강의 최종 등록
                    </button>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                        등록된 강의는 학생들에게 즉시 공개됩니다.
                    </p>
                </div>
            </aside>
        </div>
    );
}
