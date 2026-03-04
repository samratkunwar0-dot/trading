const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');
    const loginForm = document.querySelector('#loginForm');
    const loginBtn = document.querySelector('.login-btn');


    const loaderWrapper = document.getElementById('loaderWrapper');
    if (loaderWrapper) {
        setTimeout(() => {
            loaderWrapper.classList.add('loader-hidden');
            setTimeout(() => { loaderWrapper.style.display = 'none'; }, 500);
        }, 1500);
    }


    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }


    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;
            const originalText = loginBtn.innerHTML;


            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Authenticating...</span>';
            loginBtn.style.background = '#23a2f6';
            loginBtn.style.color = '#ffffff';
            loginBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput }),
                });

                const data = await res.json();

                if (res.ok) {

                    loginBtn.innerHTML = '<i class="fas fa-check"></i> <span>Success!</span>';
                    loginBtn.style.background = '#28a745';

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('displayName', data.displayName);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
                    localStorage.setItem('isSuperAdmin', data.isSuperAdmin ? 'true' : 'false');

                    setTimeout(() => {
                        loginBtn.innerHTML = originalText;
                        loginBtn.style.background = '';
                        loginBtn.style.color = '';
                        loginBtn.disabled = false;
                        loginForm.reset();
                        window.location.href = 'dashboard.html';
                    }, 1500);

                } else {

                    loginBtn.innerHTML = '<i class="fas fa-times"></i> <span>Invalid Credentials</span>';
                    loginBtn.style.background = '#dc3545';

                    setTimeout(() => {
                        loginBtn.innerHTML = originalText;
                        loginBtn.style.background = '';
                        loginBtn.style.color = '';
                        loginBtn.disabled = false;
                    }, 2000);
                }

            } catch (err) {

                loginBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Server Offline</span>';
                loginBtn.style.background = '#dc3545';
                console.error('Login error:', err);

                setTimeout(() => {
                    loginBtn.innerHTML = originalText;
                    loginBtn.style.background = '';
                    loginBtn.style.color = '';
                    loginBtn.disabled = false;
                }, 2500);
            }
        });
    }
});
