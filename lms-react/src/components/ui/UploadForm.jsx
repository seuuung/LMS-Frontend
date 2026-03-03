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
        if (!requireAuth(allowedRoles)) return;
        if (!classId) return;

        api.classes.getById(classId).then(cls => {
            if (!cls || (user.role !== 'admin' && cls.profId !== user.id)) {
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

    // 역할별 사이드바 메뉴 구성
    const isAdmin = basePath === '/admin';
    const menuTitle = isAdmin ? 'Admin Menu' : 'Professor Menu';

    return (
        <div className="dashboard-grid">
            <aside className="sidebar">
                <h3 style={{ padding: '0 1rem', marginBottom: '1rem' }}>{menuTitle}</h3>
                {isAdmin ? (
                    <>
                        <Link href="/admin?t=users" className="nav-item">사용자 관리</Link>
                        <Link href="/admin?t=classes" className="nav-item active">전체 클래스 관리</Link>
                    </>
                ) : (
                    <div className="nav-item active">강의 업로드</div>
                )}
            </aside>

            <div className="content">
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Link href={`${basePath}/class/${classId}`} className="btn btn-back">&larr; 강의 목록으로</Link>
                        <h2 style={{ margin: 0 }}>새 강의 업로드 (유튜브 연동)</h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>유튜브 링크를 입력하여 새로운 강의를 클래스에 추가하세요.</p>

                    <div className="lecture-layout">
                        {/* 좌측: 폼 입력 영역 */}
                        <div>
                            <div className="form-group mb-4">
                                <label className="form-label">강의 제목</label>
                                <input type="text" className="form-control" placeholder="예: [1주차] LMS 시스템 아키텍처" value={lecTitle} onChange={e => setLecTitle(e.target.value)} />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">강의 설명 (선택)</label>
                                <textarea className="form-control" placeholder="이 강의에서 다룰 내용을 간략히 적어주세요." style={{ minHeight: '100px' }} value={lecDesc} onChange={e => setLecDesc(e.target.value)}></textarea>
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">유튜브 링크</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" className="form-control" placeholder="https://youtu.be/..." value={lecLink} onChange={e => setLecLink(e.target.value)} />
                                    <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handlePreview}>미리보기 적용</button>
                                </div>
                            </div>

                            <div className="form-group mb-4 p-4" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                <label className="form-label mb-2" style={{ display: 'block' }}>자료 파일 첨부 (선택)</label>
                                <input type="file" id="resFile" className="form-control" style={{ border: 'none', background: 'transparent', padding: 0 }} onChange={e => setResFile(e.target.files[0])} />
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                    {resFile ? `첨부됨: ${resFile.name}` : ''}
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.05rem', padding: '0.8rem' }} onClick={handleCreateLecture}>강의 최종 등록</button>
                        </div>

                        {/* 우측: 영상 미리보기 */}
                        <div className="side-card">
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>영상 미리보기</h4>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {previewId ? (
                                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${previewId}`} frameBorder="0" allowFullScreen></iframe>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>링크를 입력하면 미리보기가 표시됩니다.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
