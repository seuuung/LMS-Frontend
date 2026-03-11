'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { api } from '@/lib/api/api';
import { extractVideoId } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import ActionButton from '@/components/ui/ActionButton';

export default function LectureViewPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Lecture...</div>}>
            <LectureView />
        </Suspense>
    );
}

/**
 * 개별 강의(비디오) 시청 및 관리 페이지 컴포넌트
 * 유튜브 IFrame API를 이용해 영상을 렌더링하고 시청 진도율(Progress)을 추적 및 기록합니다.
 * 교수/관리자는 강의 정보와 첨부 자료를 수정/삭제/추가할 수 있습니다.
 * @returns {JSX.Element|null}
 */
function LectureView() {
    const { requireAuth, user } = useAuth();
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');
    const lectureId = searchParams.get('lectureId');
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [lecture, setLecture] = useState(null);
    const [resources, setResources] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLink, setEditLink] = useState('');

    // Professor Add Resource State
    const [resFile, setResFile] = useState(null);

    // Player & Progress State
    const playerRef = useRef(null);
    const [progressRate, setProgressRate] = useState(0);
    const [statsInfo, setStatsInfo] = useState(null); // 교수자용 통계 정보

    const currentRateRef = useRef(0);
    const maxAllowedTimeRef = useRef(0);
    const isEnforcingRef = useRef(false);

    useEffect(() => {
        if (!requireAuth(['student', 'prof', 'admin'])) return;
        if (!classId || !lectureId) {
            showToast('잘못된 접근입니다.', 'error');
            router.back();
            return;
        }
        loadData();
    }, [user, classId, lectureId]);

    const loadData = async () => {
        try {
            const lectures = await api.lectures.getByClass(classId);
            const targetLec = lectures.find(l => String(l.id) === String(lectureId));
            if (!targetLec) {
                showToast('강의를 찾을 수 없습니다.', 'error');
                router.back();
                return;
            }
            setLecture(targetLec);

            await loadResourcesData(targetLec);

            // Student progress logic
            if (user.role === 'student') {
                const views = await api.lectureViews.getByClassAndStudent(classId, user.userId);
                const viewInfo = views.find(v => String(v.lectureId) === String(lectureId));
                const rate = viewInfo ? (viewInfo.progressRate || 0) : 0;
                currentRateRef.current = rate;
                setProgressRate(rate);
            } else {
                // Prof/Admin stats summary
                const [enrollments, allViews] = await Promise.all([
                    api.enrollments.getByClass(classId),
                    api.lectureViews.getByClass(classId)
                ]);
                const totalStudents = enrollments.length;
                const completedCount = allViews.filter(v =>
                    String(v.lectureId) === String(lectureId) && v.progressRate >= 95
                ).length;
                setStatsInfo({ completedCount, totalStudents });
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const loadResourcesData = async (targetLec) => {
        const fetchedResources = await api.resources.getByClass(classId);
        const lectureRes = fetchedResources.filter(r =>
            String(r.lectureId) === String(lectureId) ||
            (targetLec && r.title === `[${targetLec.title}] 첨부자료`)
        );
        setResources(lectureRes);
    };

    useEffect(() => {
        if (!lecture) return;

        // Load Youtube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = initPlayer;
        } else {
            initPlayer();
        }

        let skipCheckInterval;
        let progressInterval;

        /**
         * 유튜브 플레이어 초기화 함수
         * utils의 extractVideoId를 통해 링크에서 ID만 추출하여 플레이어를 마운트합니다.
         */
        function initPlayer() {
            const videoId = extractVideoId(lecture.youtubeLink);
            if (!videoId) return;

            // YouTube Player 객체 초기화 (ID: vidPlayer인 요소에 바인딩)
            playerRef.current = new window.YT.Player('vidPlayer', {
                videoId: videoId,
                playerVars: { 'playsinline': 1, 'rel': 0 },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onPlaybackRateChange': onPlaybackRateChange
                }
            });
        }

        function onPlayerReady(event) {
            const player = event.target;
            const duration = player.getDuration();

            if (duration > 0 && user?.role === 'student') {
                maxAllowedTimeRef.current = (currentRateRef.current / 100) * duration;
                if (currentRateRef.current > 0 && currentRateRef.current < 95) {
                    player.seekTo(maxAllowedTimeRef.current, true);
                    showToast(`수강률 ${currentRateRef.current}% 위치부터 이어서 재생합니다.`, 'success');
                }

                skipCheckInterval = setInterval(() => {
                    checkAndEnforcePosition(player);
                }, 500);
            }
        }

        function onPlayerStateChange(event) {
            const player = event.target;
            if (event.data === window.YT.PlayerState.PLAYING) {
                if (!progressInterval) {
                    progressInterval = setInterval(() => {
                        updateProgress(player);
                    }, 3000);
                }
            } else {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                updateProgress(player);
            }
        }

        function onPlaybackRateChange(event) {
            const player = event.target;
            if (user?.role !== 'student') return;

            const isCompleted = currentRateRef.current >= 95;
            if (!isCompleted) {
                const currentRate = player.getPlaybackRate();
                if (currentRate > 1.0) {
                    player.setPlaybackRate(1.0);
                    showToast('수강 완료 전에는 배속 재생이 제한됩니다.', 'error');
                }
            }
        }

        /**
         * 구간 건너뛰기 방지 로직 (학생 전역)
         * 현재 재생 위치가 허용된 최대 시청 위치(maxAllowedTimeRef)를 벗어나면 강제로 이전 위치로 되돌립니다.
         * 학습자가 이미 보았던 구간(95% 이상 완료된 영상)에 대해서는 제한을 해제합니다.
         */
        const checkAndEnforcePosition = (player) => {
            if (user?.role !== 'student') return;

            // 95% 이상이면 수강 완료로 간주하여 건너뛰기 제한 해제
            const isCompleted = currentRateRef.current >= 95;

            try {
                const state = player.getPlayerState();
                // 재생 중이거나 버퍼링 중인 상태에서만 체크
                if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) return;

                const currentTime = player.getCurrentTime();
                const tolerance = 3; // 3초 정도의 오차 범위 허용

                // 미완료 강의에 대해 현재 위치가 이전에 보았던 최대 위치를 넘어서면 되돌림
                if (!isCompleted && currentTime > maxAllowedTimeRef.current + tolerance) {
                    player.pauseVideo();
                    player.seekTo(maxAllowedTimeRef.current, true);
                    setTimeout(() => { player.playVideo(); }, 300);

                    if (!isEnforcingRef.current) {
                        isEnforcingRef.current = true;
                        showToast('아직 시청하지 않은 구간은 건너뛸 수 없습니다.', 'error');
                        setTimeout(() => { isEnforcingRef.current = false; }, 3000);
                    }
                } else {
                    // 정상 시청 중이라면 허용된 최대 시간(maxAllowedTime)을 현재 시간으로 갱신
                    if (currentTime > maxAllowedTimeRef.current) {
                        maxAllowedTimeRef.current = currentTime;
                    }
                }
            } catch (e) {
                // 예외 상황 무시
            }
        };

        /**
         * 실시간 시청 진도 업데이트 함수
         * 주기적으로(3초) 현재 시청 위치를 백엔드(Mock API)에 저장합니다.
         */
        const updateProgress = async (player) => {
            if (user?.role !== 'student') return;
            try {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                if (duration > 0) {
                    // 건너뛰기 강제 로직 작동 범위 밖이면 업데이트 중단
                    if (currentTime > maxAllowedTimeRef.current + 2) return;

                    let percent = Math.floor((currentTime / duration) * 100);
                    if (percent > 100) percent = 100;

                    // 현재 위치가 최대 도달 위치보다 크면 갱신
                    if (currentTime > maxAllowedTimeRef.current) {
                        maxAllowedTimeRef.current = currentTime;
                    }

                    // 수강률이 이전보다 작아지지 않도록 보정 (Max 유지)
                    percent = Math.max(percent, currentRateRef.current);
                    currentRateRef.current = percent;

                    // 상태 업데이트 및 API 호출 (로딩 UI는 무거운 업데이트이므로 스킵)
                    await api.lectureViews.updateProgress(classId, lectureId, user.userId, percent, currentTime, { skipLoading: true });
                    setProgressRate(percent);
                }
            } catch (e) {
                // 성능 저하를 방지하기 위해 에러는 조용히 처리
            }
        };

        return () => {
            if (skipCheckInterval) clearInterval(skipCheckInterval);
            if (progressInterval) clearInterval(progressInterval);

            // Cleanup player if possible
            if (playerRef.current && playerRef.current.destroy) {
                try {
                    playerRef.current.destroy();
                } catch (e) { }
            }
        };
    }, [lecture?.youtubeLink, user, classId, lectureId]);

    const handleEditInit = () => {
        setEditTitle(lecture.title);
        setEditDesc(lecture.description);
        setEditLink(lecture.youtubeLink);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim()) return showToast('강의 제목을 입력하세요.', 'error');
        if (!editLink.trim()) return showToast('유튜브 링크를 입력하세요.', 'error');

        try {
            const updated = await api.lectures.update(lectureId, {
                title: editTitle.trim(),
                description: editDesc.trim(),
                youtubeLink: editLink.trim()
            });

            setLecture(updated);
            setIsEditing(false);
            showToast('강의가 수정되었습니다.', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const handleDeleteResource = async (resId) => {
        if (!await confirm('자료를 삭제하시겠습니까?')) return;
        try {
            await api.resources.delete(resId);
            showToast('자료가 삭제되었습니다.', 'success');
            loadResourcesData(lecture);
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const handleAddResource = async () => {
        if (!resFile) return showToast('파일을 선택하세요.', 'error');
        try {
            const title = `[자료] ${resFile.name.split('.')[0]}`;
            await api.resources.create(classId, title, '강의 첨부자료', resFile.name, lectureId);
            showToast('새 자료가 추가되었습니다.', 'success');
            setResFile(null);

            // Clear input
            const fileInput = document.getElementById('sidebarResFile');
            if (fileInput) fileInput.value = '';

            loadResourcesData(lecture);
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    if (!user || !lecture) return null;

    const isInstructorMode = user.role === 'prof' || user.role === 'admin';

    const badgeEl = user.role === 'student' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>진도율:</span>
            <StatusBadge rate={progressRate} />
        </div>
    ) : statsInfo ? (
        <span className="badge badge-complete" style={{ whiteSpace: 'nowrap' }}>
            수강 완료 {statsInfo.completedCount}명 / 전체 {statsInfo.totalStudents}명
        </span>
    ) : null;

    return (
        <div className="container lecture-layout">

            {/* 영상 영역 (Main) */}
            <section className="main-lecture">
                <div className="video-wrapper">
                    <div id="vidPlayer"></div>
                </div>

                <div className="lecture-info-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            {!isEditing ? (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', wordBreak: 'keep-all' }}>{lecture.title}</h2>
                                    <p style={{ color: 'var(--text-muted)' }}>{lecture.description}</p>
                                </>
                            ) : (
                                <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input type="text" className="form-control" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="강의 제목" />
                                    <textarea className="form-control" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="강의 설명"></textarea>
                                    <input type="text" className="form-control" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="YouTube 링크" />
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            {badgeEl}

                            {isInstructorMode && !isEditing && (
                                <button className="btn" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', fontSize: '0.85rem', padding: '0.3rem 0.6rem' }} onClick={handleEditInit}>수정하기</button>
                            )}
                            {isInstructorMode && isEditing && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} onClick={handleSaveEdit}>저장</button>
                                    <button className="btn btn-cancel" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setIsEditing(false)}>취소</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 자료 영역 (Sidebar) */}
            <aside className="sidebar">
                <div className="side-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>학습 현황</h3>
                    {badgeEl}

                    {isInstructorMode && statsInfo && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                            <ActionButton
                                variant="primary"
                                style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}
                                onClick={() => router.push(`/lecture_stats?classId=${classId}&lectureId=${lectureId}`)}
                            >
                                수강률 통계
                            </ActionButton>
                        </div>
                    )}
                </div>

                <div className="side-card">
                    <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>첨부 자료</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>총 {resources.length}건</span>
                    </h4>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {resources.length === 0 ? (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>이 강의에 등록된 자료가 없습니다.</p>
                        ) : (
                            resources.map(r => (
                                <li key={r.id} style={{ position: 'relative', paddingRight: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '1rem' }}>
                                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{r.title}</strong>
                                        <small style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{r.filename}</small>
                                        <button className="btn" onClick={() => showToast(`[${r.filename}] 다운로드를 시작합니다.`, 'success')} style={{ alignSelf: 'flex-start', marginTop: '0.7rem', fontSize: '0.8rem', padding: '0.3rem 0.7rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>다운로드</button>
                                    </div>
                                    {isInstructorMode && (
                                        <button onClick={() => handleDeleteResource(r.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'background 0.2s' }}>
                                            &times;
                                        </button>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>

                    {isInstructorMode && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                            <h5 style={{ marginBottom: '0.8rem' }}>자료 파일 추가</h5>
                            <input type="file" id="sidebarResFile" className="form-control" style={{ marginBottom: '0.5rem', padding: '0.3rem', fontSize: '0.85rem' }} onChange={e => setResFile(e.target.files[0])} />
                            <button className="btn btn-primary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.9rem' }} onClick={handleAddResource}>추가하기</button>
                        </div>
                    )}
                </div>
            </aside>

        </div>
    );
}
