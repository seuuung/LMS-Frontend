import { api } from './api.js';
import { setCurrentUser, showToast, getCurrentUser } from './common.js';

document.addEventListener('DOMContentLoaded', () => {
    // 이미 로그인된 경우 역할에 맞는 페이지로 이동
    const user = getCurrentUser();
    if (user) {
        redirectByRole(user.role);
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');

    const formViewLogin = document.getElementById('formViewLogin');
    const formViewRegister = document.getElementById('formViewRegister');

    // 뷰 토글
    toggleToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        formViewLogin.style.display = 'none';
        formViewRegister.style.display = 'block';
    });

    toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formViewRegister.style.display = 'none';
        formViewLogin.style.display = 'block';
    });

    // 로그인 로직
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        const submitBtn = loginForm.querySelector('button');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '로그인 중...';
            const user = await api.auth.login(username, password);
            setCurrentUser(user);
            showToast('로그인 성공!', 'success');
            redirectByRole(user.role);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '로그인';
        }
    });

    // 회원가입 로직
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.reg_username.value;
        const password = registerForm.reg_password.value;
        const name = registerForm.reg_name.value;
        const role = registerForm.reg_role.value;
        const submitBtn = registerForm.querySelector('button');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '가입 중...';
            await api.auth.register({ username, password, name, role });
            showToast('회원가입 성공! 로그인해주세요.', 'success');

            // 로그인 화면으로 전환
            formViewRegister.style.display = 'none';
            formViewLogin.style.display = 'block';
            loginForm.username.value = username;

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '회원가입';
        }
    });
});

function redirectByRole(role) {
    if (role === 'admin') window.location.href = 'admin.html';
    else if (role === 'prof') window.location.href = 'professor.html';
    else if (role === 'student') window.location.href = 'student.html';
}
