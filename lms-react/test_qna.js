const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const artifactsDir = 'C:\\Users\\figig\\.gemini\\antigravity\\brain\\4f1283f9-5419-4a91-b6a2-548316453b69';

    // 1. 학생 로그인 및 질문 작성, QnA 탭 UI 확인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'test2');
    await page.fill('input[type="password"]', '1');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(1000);

    // 학생 대시보드에서 첫번째 클래스 클릭
    const classLinks = await page.$$('.class-card .btn-primary');
    if (classLinks.length > 0) {
        await classLinks[0].click();
        await page.waitForTimeout(1000);
        // QnA 탭 클릭
        await page.click('button.tab-btn:has-text("QnA")');
        await page.waitForTimeout(500);

        // 질문 등록
        await page.click('button:has-text("질문하기")');
        await page.fill('input[placeholder="제목"]', '학생 질문입니다');
        await page.fill('textarea[placeholder="내용"]', '교수님, 질문이 있습니다!');
        await page.click('button:has-text("등록")');
        await page.waitForTimeout(1000);

        // 추가된 질문 클릭하여 아코디언 열기
        await page.click('.qna-header-title >> text=학생 질문입니다');
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(artifactsDir, 'qna_student_view_' + Date.now() + '.png'), fullPage: true });
        console.log('Student QnA view captured.');
    }

    // 로그아웃
    await page.evaluate(() => localStorage.removeItem('user'));

    // 2. 교수 로그인 및 답변 작성
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'test1');
    await page.fill('input[type="password"]', '1');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(1000);

    const profClassLinks = await page.$$('.class-card .btn-primary');
    if (profClassLinks.length > 0) {
        await profClassLinks[0].click();
        await page.waitForTimeout(1000);
        // QnA 탭 클릭
        await page.click('button.tab-btn:has-text("QnA")');
        await page.waitForTimeout(500);

        // 추가된 질문 클릭하여 아코디언 열기
        await page.click('.qna-header-title >> text=학생 질문입니다');
        await page.waitForTimeout(500);

        // 답변 작성
        await page.fill('textarea[placeholder*="답변을 작성해주세요"]', '네, 무엇이 궁금하신가요?');
        await page.click('button:has-text("답변 등록")');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(artifactsDir, 'qna_prof_view_' + Date.now() + '.png'), fullPage: true });
        console.log('Professor QnA view captured.');
    }

    // 로그아웃
    await page.evaluate(() => localStorage.removeItem('user'));

    // 3. 관리자 로그인 및 확인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', '1');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(1000);

    // 클래스 관리 탭 이동
    await page.click('button.tab-btn:has-text("클래스 목록")');
    await page.waitForTimeout(500);

    const adminClassLinks = await page.$$('.class-card .btn-primary:has-text("클래스 관리")');
    if (adminClassLinks.length > 0) {
        await adminClassLinks[0].click();
        await page.waitForTimeout(1000);
        // QnA 관리 탭 클릭
        await page.click('button.tab-btn:has-text("QnA")');
        await page.waitForTimeout(500);

        // 추가된 질문 클릭하여 아코디언 열기
        await page.click('.qna-header-title >> text=학생 질문입니다');
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(artifactsDir, 'qna_admin_view_' + Date.now() + '.png'), fullPage: true });
        console.log('Admin QnA view captured.');
    }

    await browser.close();
})();
