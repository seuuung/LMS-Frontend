import { requireAuth, logout, showToast } from './common.js';
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

    // 뒤로가기 버튼 셋업
    document.getElementById('btnBack').addEventListener('click', (e) => {
        e.preventDefault();
        location.href = user.role === 'student' ? 'student.html' : 'professor.html';
    });

    document.getElementById('userInfo').innerHTML = `
        <span style="font-weight:bold; margin-right:1rem;">${user.name} 님</span>
    `;

    // 1. 강의 정보 불러오기
    const lectures = await api.lectures.getByClass(classId);
    const lecture = lectures.find(l => l.id === lectureId);

    if (!lecture) {
        alert('강의를 찾을 수 없습니다.');
        history.back();
        return;
    }

    // 유튜브 링크에서 Video ID 추출
    let videoId = '';
    let embedLink = lecture.youtubeLink;
    if (embedLink.includes('youtu.be/')) videoId = embedLink.split('youtu.be/')[1].split('?')[0];
    else if (embedLink.includes('watch?v=')) videoId = embedLink.split('watch?v=')[1].split('&')[0];
    else if (embedLink.includes('embed/')) videoId = embedLink.split('embed/')[1].split('?')[0];

    document.getElementById('lecTitle').innerText = lecture.title;
    document.getElementById('lecDesc').innerText = lecture.description;

    const statusBadge = document.getElementById('statusBadge');

    if (user.role !== 'student') {
        statusBadge.innerText = '교수자 시청 (진도 기록 안 됨)';
        statusBadge.style.background = '#fef3c7';
        statusBadge.style.color = '#92400e';
    } else {
        const views = await api.lectureViews.getByClassAndStudent(classId, user.id);
        const viewInfo = views.find(v => v.lectureId === lectureId);
        const currentRate = viewInfo ? (viewInfo.progressRate || 0) : 0;

        if (currentRate >= 90) {
            statusBadge.innerText = `수강 완료 (100%)`;
            statusBadge.style.background = '#dcfce7';
            statusBadge.style.color = '#166534';
        } else if (currentRate > 0) {
            statusBadge.innerText = `현재 수강률: ${currentRate}%`;
            statusBadge.style.background = '#dbeafe';
            statusBadge.style.color = '#1e40af';
        } else {
            statusBadge.innerText = `미수강 (0%)`;
            statusBadge.style.background = '#e2e8f0';
            statusBadge.style.color = '#475569';
        }
    }

    // YouTube IFrame API 로드 및 플레이어 초기화
    window.onYouTubeIframeAPIReady = () => {
        const player = new YT.Player('vidPlayer', {
            videoId: videoId,
            playerVars: { 'playsinline': 1, 'rel': 0 },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });

        let progressInterval;

        function onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.PLAYING) {
                if (!progressInterval) {
                    progressInterval = setInterval(() => updateProgress(player), 3000);
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
                let percent = Math.floor((currentTime / duration) * 100);
                if (percent > 100) percent = 100;

                await api.lectureViews.updateProgress(classId, lectureId, user.id, percent);

                if (percent >= 90) {
                    statusBadge.innerText = `수강 완료 (100%)`;
                    statusBadge.style.background = '#dcfce7';
                    statusBadge.style.color = '#166534';
                } else {
                    statusBadge.innerText = `수강 중 (${percent}%)`;
                    statusBadge.style.background = '#dbeafe';
                    statusBadge.style.color = '#1e40af';
                }
            }
        } catch (e) { }
    }

    // YouTube API 스크립트 동적 삽입
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. 자원(자료) 목록 불러오기 및 다운로드 렌더링
    const resources = await api.resources.getByClass(classId);
    const resList = document.getElementById('resList');

    if (resources.length === 0) {
        resList.innerHTML = '<p style="font-size:0.9rem; color:var(--text-muted);">이 강좌에 등록된 자료가 없습니다.</p>';
    } else {
        resList.innerHTML = resources.map(r => `
            <li>
                <div style="display:flex; flex-direction:column;">
                    <strong style="color:var(--text-main);">${r.title}</strong>
                    <small style="color:var(--text-muted);">${r.filename}</small>
                </div>
                <!-- a 태그 href="#" 처리하고 js 로 가상 다운로드 알림 -->
                <a href="#" class="btn-download" data-filename="${r.filename}">다운로드</a>
            </li>
        `).join('');

        // 가상 다운로드 알림 이벤트 바인딩
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const fname = e.target.getAttribute('data-filename');
                showToast(`[${fname}] 다운로드를 시작합니다.`, 'success');
            });
        });
    }
});
