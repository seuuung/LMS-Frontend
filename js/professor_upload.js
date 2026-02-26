import { api } from './api.js';
import { requireAuth, showToast, extractVideoId, handleApiError } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    // requireAuth로 인증 로직 통합 (기존 alert/수동 체크 대체)
    const currentUser = requireAuth(['prof']);
    if (!currentUser) return;

    // URL에서 classId 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');

    if (!classId) {
        showToast('해당 클래스 정보를 찾을 수 없습니다.', 'error');
        location.href = 'professor.html';
        return;
    }

    // 해당 클래스 유효성 확인
    const cls = await api.classes.getById(classId);
    if (!cls || cls.profId !== currentUser.id) {
        showToast('해당 클래스에 접근할 권한이 없거나 존재하지 않는 클래스입니다.', 'error');
        location.href = 'professor.html';
        return;
    }

    // 뒤로가기 버튼 링크 설정 (이전 페이지 = 강의 목록으로 복귀)
    document.getElementById('btnBackToProf').addEventListener('click', (e) => {
        e.preventDefault();
        history.back();
    });

    // 2. 영상 미리보기 기능 — extractVideoId 공통 함수 사용
    document.getElementById('btnPreviewVid').addEventListener('click', () => {
        const link = document.getElementById('lecLink').value.trim();
        const previewArea = document.getElementById('previewArea');

        if (!link) {
            return showToast('유튜브 링크를 입력해주세요.', 'error');
        }

        const videoId = extractVideoId(link);

        if (videoId) {
            previewArea.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
            showToast('영상이 연결되었습니다.', 'success');
        } else {
            showToast('올바른 유튜브 링크가 아닙니다.', 'error');
        }
    });

    // 3. 자료 파일 첨부 기능
    const resFileInput = document.getElementById('resFile');
    const resFileNameDisplay = document.getElementById('resFileNameDisplay');

    resFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            resFileNameDisplay.textContent = `첨부됨: ${file.name}`;
        } else {
            resFileNameDisplay.textContent = '';
        }
    });

    // 4. 강의 최종 등록 기능 (자료 첨부 포함)
    document.getElementById('btnCreateLec').addEventListener('click', async () => {
        const title = document.getElementById('lecTitle').value.trim();
        const desc = document.getElementById('lecDesc').value.trim();
        const link = document.getElementById('lecLink').value.trim();

        if (!title) {
            return showToast('강의 제목을 입력하세요.', 'error');
        }
        if (!link) {
            return showToast('유튜브 강의 링크를 입력하세요.', 'error');
        }

        try {
            // 강의 등록
            await api.lectures.create(classId, title, desc, link);

            // 첨부 파일이 있으면 자료도 함께 등록
            if (resFileInput.files && resFileInput.files.length > 0) {
                const filename = resFileInput.files[0].name;
                await api.resources.create(classId, `[${title}] 첨부자료`, desc, filename);
            }

            showToast('새 강의가 성공적으로 등록되었습니다!', 'success');

            // 약간의 딜레이 후 대시보드로 이동
            setTimeout(() => {
                location.href = `professor_class.html?classId=${classId}`;
            }, 1000);
        } catch (e) {
            handleApiError(e, '강의 등록 중 오류가 발생했습니다.');
        }
    });
});
