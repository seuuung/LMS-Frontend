import { api } from './api.js';
import { requireAuth, renderNavbar, renderFooter, escapeHtml, renderStatusBadge, handleApiError } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth(['prof']);
    const params = new URLSearchParams(location.search);
    const classId = params.get('classId');
    const lectureId = params.get('lectureId');

    if (!classId || !lectureId) {
        alert('필수 정보가 누락되었습니다.');
        location.href = 'professor.html';
        return;
    }

    // 네비게이션 및 푸터 렌더링
    renderNavbar(user);
    renderFooter();

    // 뒤로 가기 링크 설정
    document.getElementById('btnBack').href = `professor_class.html?classId=${classId}`;

    const statsTitle = document.getElementById('statsTitle');
    const statsBody = document.getElementById('statsBody');

    async function loadStats() {
        try {
            // 1. 기본 데이터 로드 (병렬)
            const [lecture, students, enrollments, allViews] = await Promise.all([
                api.lectures.getById(lectureId),
                api.users.getAll(),
                api.enrollments.getByClass(classId),
                api.lectureViews.getByClass(classId)
            ]);

            // 2. 강의 정보 렌더링
            statsTitle.innerText = `[${lecture.title}] 수강률 통계`;
            const lectureInfoSidebar = document.getElementById('lectureInfoSidebar');
            if (lectureInfoSidebar) {
                lectureInfoSidebar.innerHTML = `
                    <h4>${escapeHtml(lecture.title)}</h4>
                    <p>${escapeHtml(lecture.description)}</p>
                `;
            }

            // 3. 수강생별 데이터 매핑
            // 해당 클래스에 수강신청한 유저들만 필터링
            const enrolledUsers = students.filter(u =>
                enrollments.some(e => e.studentId === u.id) && u.role === 'student'
            );

            if (enrolledUsers.length === 0) {
                statsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:3rem; color:var(--text-muted);">수강 신청한 학생이 없습니다.</td></tr>';
                return;
            }

            statsBody.innerHTML = enrolledUsers.map(u => {
                // 해당 학생의 해당 강의 시청 이력 찾기
                const view = allViews.find(v => v.lectureId === lectureId && v.studentId === u.id);
                const rate = view ? (view.progressRate || 0) : 0;

                return `
                    <tr>
                        <td><strong>${escapeHtml(u.name)}</strong></td>
                        <td style="color:var(--text-muted); font-size:0.85rem;">${escapeHtml(u.id)}</td>
                        <td>
                            <div style="display:flex; align-items:center; gap:0.7rem;">
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill" style="width: ${rate}%"></div>
                                </div>
                                <span style="font-size:0.85rem; font-weight:600; min-width:35px;">${Math.round(rate)}%</span>
                            </div>
                        </td>
                        <td>${renderStatusBadge(rate)}</td>
                    </tr>
                `;
            }).join('');

        } catch (e) {
            handleApiError(e);
            statsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:3rem; color:#ef4444;">데이터 로드 중 오류가 발생했습니다.</td></tr>';
        }
    }

    loadStats();
});
