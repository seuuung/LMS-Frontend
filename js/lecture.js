import { requireAuth, showToast, extractVideoId, renderStatusBadge, escapeHtml, handleApiError } from './common.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['student', 'prof']);
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');
    const lectureId = urlParams.get('lectureId');

    if (!classId || !lectureId) {
        alert('잘못된 접근입니다.');
        history.back();
        return;
    }

    // 뒤로가기 버튼 셋업 (이전 페이지로 복귀)
    document.getElementById('btnBack').addEventListener('click', (e) => {
        e.preventDefault();
        history.back();
    });

    document.getElementById('userInfo').innerHTML = `
        <span style="font-weight:bold; margin-right:1rem;">${escapeHtml(user.name)} 님</span>
    `;

    // 1. 강의 정보 불러오기
    const lectures = await api.lectures.getByClass(classId);
    const lecture = lectures.find(l => l.id === lectureId);

    if (!lecture) {
        alert('강의를 찾을 수 없습니다.');
        history.back();
        return;
    }

    let videoId = extractVideoId(lecture.youtubeLink);

    document.getElementById('lecTitle').innerText = lecture.title;
    document.getElementById('lecDesc').innerText = lecture.description;

    const statusBadge = document.getElementById('statusBadge');

    // ========== 교수자 수정 기능 ==========
    if (user.role === 'prof') {
        const btnEdit = document.getElementById('btnEditLecture');
        const viewMode = document.getElementById('lectureViewMode');
        const editMode = document.getElementById('lectureEditMode');

        btnEdit.style.display = 'inline-flex';

        // 수정 버튼 → 편집 모드 전환
        btnEdit.addEventListener('click', () => {
            document.getElementById('editLecTitle').value = lecture.title;
            document.getElementById('editLecDesc').value = lecture.description;
            document.getElementById('editLecLink').value = lecture.youtubeLink;

            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });

        // 취소 버튼 → 보기 모드 복귀
        document.getElementById('btnCancelEdit').addEventListener('click', () => {
            editMode.style.display = 'none';
            viewMode.style.display = 'block';
        });

        // 저장 버튼 → API 호출 후 반영
        document.getElementById('btnSaveEdit').addEventListener('click', async () => {
            const newTitle = document.getElementById('editLecTitle').value.trim();
            const newDesc = document.getElementById('editLecDesc').value.trim();
            const newLink = document.getElementById('editLecLink').value.trim();

            if (!newTitle) return showToast('강의 제목을 입력하세요.', 'error');
            if (!newLink) return showToast('유튜브 링크를 입력하세요.', 'error');

            try {
                const updated = await api.lectures.update(lectureId, {
                    title: newTitle,
                    description: newDesc,
                    youtubeLink: newLink
                });

                // 로컬 데이터 반영
                lecture.title = updated.title;
                lecture.description = updated.description;
                lecture.youtubeLink = updated.youtubeLink;

                // 보기 모드 UI 갱신
                document.getElementById('lecTitle').innerText = updated.title;
                document.getElementById('lecDesc').innerText = updated.description;

                // 영상 링크가 변경된 경우 플레이어 교체
                const newVideoId = extractVideoId(updated.youtubeLink);
                if (newVideoId && newVideoId !== videoId) {
                    videoId = newVideoId;
                    const playerEl = document.getElementById('vidPlayer');
                    if (playerEl) {
                        // YouTube API 플레이어 인스턴스가 있으면 loadVideoById 사용 권장되나
                        // iframe src 변경 방식으로도 작동 가능 (onYouTubeIframeAPIReady 재호출 방지 필요)
                        const iframe = playerEl.querySelector('iframe') || playerEl;
                        iframe.src = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&enablejsapi=1`;
                    }
                }

                editMode.style.display = 'none';
                viewMode.style.display = 'block';
                showToast('강의가 수정되었습니다.', 'success');
            } catch (e) {
                handleApiError(e);
            }
        });
    }

    // 기존 진도율 로드 (건너뛰기 방지에서도 참조)
    let currentRate = 0;
    let maxAllowedTime = 0; // 학생이 시청 가능한 최대 위치 (초)
    let lastPosition = 0; // 이어보기 위치 (초)

    if (user.role === 'student') {
        const views = await api.lectureViews.getByClassAndStudent(classId, user.id);
        const viewInfo = views.find(v => v.lectureId === lectureId);
        currentRate = viewInfo ? (viewInfo.progressRate || 0) : 0;
        lastPosition = viewInfo ? (viewInfo.lastPosition || 0) : 0;

        // 뱃지 렌더링을 공통 함수로 처리
        const badgeEl = renderStatusBadge(currentRate, { asElement: true });
        statusBadge.textContent = '';
        statusBadge.className = badgeEl.className;
        statusBadge.textContent = badgeEl.textContent;
    }

    // 학생 건너뛰기 방지: 허용 위치를 초과하면 강제 복귀
    let isEnforcing = false; // 중복 Toast 방지 플래그
    function checkAndEnforcePosition(player) {
        if (user.role !== 'student') return;
        if (currentRate >= 95) return; // 수강 완료 시 제한 해제
        try {
            const state = player.getPlayerState();
            if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) return;

            const currentTime = player.getCurrentTime();
            const tolerance = 3;

            if (currentTime > maxAllowedTime + tolerance) {
                // 건너뛰기 감지 → 차단
                player.pauseVideo();
                player.seekTo(maxAllowedTime, true);
                setTimeout(() => { player.playVideo(); }, 300);

                if (!isEnforcing) {
                    isEnforcing = true;
                    showToast('아직 시청하지 않은 구간은 건너뛸 수 없습니다.', 'error');
                    setTimeout(() => { isEnforcing = false; }, 3000);
                }
            } else {
                // 정상 시청 → maxAllowedTime 실시간 갱신
                if (currentTime > maxAllowedTime) {
                    maxAllowedTime = currentTime;
                }
            }
        } catch (e) { /* 플레이어 미초기화 시 무시 */ }
    }

    // YouTube IFrame API 로드 및 플레이어 초기화
    window.onYouTubeIframeAPIReady = () => {
        const player = new YT.Player('vidPlayer', {
            videoId: videoId,
            playerVars: { 'playsinline': 1, 'rel': 0 },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });

        let skipCheckInterval;
        let progressInterval;

        // 플레이어 준비 완료 시 허용 범위 설정 + 이어보기 + 감시 시작
        function onPlayerReady(event) {
            const duration = player.getDuration();
            if (duration > 0 && user.role === 'student') {
                maxAllowedTime = (currentRate / 100) * duration;

                // 이어보기: 미완료 강의이고 수강률이 있을 때 해당 위치에서 시작
                if (currentRate > 0 && currentRate < 95) {
                    const resumeTime = (currentRate / 100) * duration;
                    player.seekTo(resumeTime, true);
                    showToast(`수강률 ${currentRate}% 위치부터 이어서 재생합니다.`, 'success');
                }
            }
            // 500ms 간격으로 건너뛰기 상시 감시
            if (user.role === 'student') {
                skipCheckInterval = setInterval(() => {
                    checkAndEnforcePosition(player);
                }, 500);
            }
        }

        function onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.PLAYING) {
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
    };

    async function updateProgress(player) {
        if (user.role !== 'student') return;
        try {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            if (duration > 0) {
                // 건너뛴 위치에서는 진도율을 저장하지 않음
                if (currentTime > maxAllowedTime + 2) return;

                let percent = Math.floor((currentTime / duration) * 100);
                if (percent > 100) percent = 100;

                // 정상 시청으로 도달한 최대 위치 갱신 (절대 감소하지 않음)
                if (currentTime > maxAllowedTime) {
                    maxAllowedTime = currentTime;
                }

                // lastPosition도 함께 저장 (이어보기용)
                await api.lectureViews.updateProgress(classId, lectureId, user.id, percent, currentTime);

                // DB 저장 값과 동일하게 표시 (API는 높은 값만 저장하므로 max 사용)
                const displayRate = Math.max(percent, currentRate);
                if (percent > currentRate) currentRate = percent;

                // 뱃지 갱신도 공통 함수 사용
                const badgeEl = renderStatusBadge(displayRate, { asElement: true });
                statusBadge.className = badgeEl.className;
                statusBadge.textContent = badgeEl.textContent;
            }
        } catch (e) {
            handleApiError(e, '진도율 갱신 중 오류가 발생했습니다.');
        }
    }

    // YouTube API 스크립트 동적 삽입
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. 자원(자료) 관리 (사이드바)
    async function loadResources() {
        try {
            const resources = await api.resources.getByClass(classId);
            const resList = document.getElementById('resList');

            // 해당 강의(lectureId) 전용 자료 또는 레거시 첨부파일 필터링
            // 최신 강의 정보를 다시 확인 (제목 변경 대응 및 타입 불일치 방지)
            const lectures = await api.lectures.getByClass(classId);
            const currentLec = lectures.find(l => l.id === lectureId);

            const lectureRes = resources.filter(r =>
                String(r.lectureId) === String(lectureId) ||
                (currentLec && r.title === `[${currentLec.title}] 첨부자료`)
            );

            if (lectureRes.length === 0) {
                resList.innerHTML = '<p style="font-size:0.9rem; color:var(--text-muted);">이 강의에 등록된 자료가 없습니다.</p>';
            } else {
                resList.innerHTML = lectureRes.map(r => `
                    <li style="position:relative; padding-right:3rem;">
                        <div style="display:flex; flex-direction:column; flex:1; padding-right:1rem;">
                            <strong style="color:var(--text-main); font-size:0.95rem;">${escapeHtml(r.title)}</strong>
                            <small style="color:var(--text-muted); margin-top:0.2rem;">${escapeHtml(r.filename)}</small>
                            <a href="#" class="btn-download" data-filename="${escapeHtml(r.filename)}" 
                               style="align-self:flex-start; margin-top:0.7rem; font-size:0.8rem; padding:0.3rem 0.7rem; background:#eff6ff; color:#3b82f6; border-radius:6px; text-decoration:none; font-weight:600;">다운로드</a>
                        </div>
                        ${user.role === 'prof' ? `
                            <button class="btn-delete-res" data-id="${r.id}" 
                                    title="삭제"
                                    style="position:absolute; top:1rem; right:1rem; background:#fef2f2; border:none; color:#ef4444; cursor:pointer; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; transition: background 0.2s;">
                                &times;
                            </button>` : ''}
                    </li>
                `).join('');
            }

            // 교수자용 추가 영역 처리
            if (user.role === 'prof') {
                document.getElementById('addResArea').style.display = 'block';
            }
        } catch (e) {
            handleApiError(e);
        }
    }

    // 자료 목록 초기 로드
    await loadResources();

    // 자료 사이드바 이벤트 위임 (다운로드/삭제)
    document.getElementById('resList').addEventListener('click', async (e) => {
        const downloadBtn = e.target.closest('.btn-download');
        const deleteBtn = e.target.closest('.btn-delete-res');

        if (downloadBtn) {
            e.preventDefault();
            const fname = downloadBtn.getAttribute('data-filename');
            showToast(`[${fname}] 다운로드를 시작합니다.`, 'success');
        }

        if (deleteBtn) {
            if (!confirm('자료를 삭제하시겠습니까?')) return;
            try {
                const resId = deleteBtn.getAttribute('data-id');
                await api.resources.delete(resId);
                showToast('자료가 삭제되었습니다.', 'success');
                loadResources();
            } catch (e) {
                handleApiError(e);
            }
        }
    });

    // 교수자 자료 추가 로직
    if (user.role === 'prof') {
        document.getElementById('btnAddRes').addEventListener('click', async () => {
            const fileInput = document.getElementById('sidebarResFile');
            if (!fileInput.files || fileInput.files.length === 0) {
                return showToast('파일을 선택하세요.', 'error');
            }

            const file = fileInput.files[0];
            try {
                const title = `[자료] ${file.name.split('.')[0]}`;
                // 현재 lectureId를 추가하여 강의 전용 자료로 생성
                await api.resources.create(classId, title, '강의 첨부자료', file.name, lectureId);
                showToast('새 자료가 추가되었습니다.', 'success');
                fileInput.value = '';
                loadResources();
            } catch (e) {
                handleApiError(e);
            }
        });
    }
});
