import { showMessage } from '../utils.js';
export class AuthService {
    constructor(connection) {
        this.currentUser = null;
        this.connection = connection;
        this.loadSession();
        this.ready = this.bootstrap();
    }
    loadSession() {
        const sessionStr = sessionStorage.getItem('user');
        if (sessionStr) {
            try {
                this.currentUser = JSON.parse(sessionStr);
            }
            catch {
                this.currentUser = null;
            }
        }
    }
    saveSession(user) {
        this.currentUser = user;
        sessionStorage.setItem('user', JSON.stringify(user));
    }
    clearSession() {
        this.currentUser = null;
        sessionStorage.removeItem('user');
    }
    async bootstrap() {
        if (this.currentUser?.auth)
            return;
        try {
            const response = await fetch('/auth/verify', {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                this.clearSession();
                return;
            }
            const payload = await response.json();
            const user = payload?.user;
            if (user?.email) {
                this.saveSession({
                    email: user.email,
                    role: user.role || 'user',
                    auth: true
                });
            }
            else {
                this.clearSession();
            }
        }
        catch {
            this.clearSession();
        }
    }
    getRoleFromCookie() {
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
        if (roleCookie) {
            return roleCookie.split('=')[1];
        }
        return 'user';
    }
    async login(email, password) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : { message: await response.text() };
            if (response.ok) {
                const user = payload?.user || {};
                this.saveSession({
                    email: user.email || email,
                    role: user.role || 'user',
                    auth: true
                });
                showMessage(payload?.message || 'Login exitoso', 'success');
                window.location.href = '/';
                return true;
            }
            showMessage(payload?.error ||
                payload?.message ||
                'No se pudo iniciar sesión', 'danger');
            return false;
        }
        catch (error) {
            console.error('Login error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }
    async signup(credentials) {
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : { message: await response.text() };
            if (response.ok) {
                showMessage(payload?.message || 'Usuario registrado exitosamente', 'success');
                window.location.href = '/login';
                return true;
            }
            showMessage(payload?.error || payload?.message || 'No se pudo registrar el usuario', 'danger');
            return false;
        }
        catch (error) {
            console.error('Signup error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }
    async logout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            this.clearSession();
            window.location.href = '/';
        }
        catch (error) {
            console.error('Logout error:', error);
        }
    }
    isAuthenticated() {
        return this.currentUser?.auth === true;
    }
    getUser() {
        return this.currentUser;
    }
    getFormToken() {
        return null;
    }
}
