import { showMessage } from '../utils.js';
import { setToken, getToken, removeAuthToken } from '../api.js';
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
            const token = getToken();
            console.log('[AuthService.bootstrap] Token from storage:', { length: token?.length });
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('[AuthService.bootstrap] Added Authorization header');
            }
            else {
                console.log('[AuthService.bootstrap] No token to add');
            }
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers
            });
            console.log('[AuthService.bootstrap] Verify response:', response.status);
            if (!response.ok) {
                removeAuthToken();
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
                removeAuthToken();
                this.clearSession();
            }
        }
        catch {
            removeAuthToken();
            this.clearSession();
        }
    }
    async login(email, password) {
        try {
            console.log('[AuthService.login] Starting login...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            console.log('[AuthService.login] Response status:', response.status);
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : { message: await response.text() };
            console.log('[AuthService.login] Payload:', { message: payload.message, hasToken: !!payload.token, hasUser: !!payload.user });
            if (response.ok) {
                const user = payload?.user || {};
                const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
                console.log('[AuthService.login] Token received:', { length: token?.length, isString: typeof token === 'string' });
                if (!token) {
                    removeAuthToken();
                    this.clearSession();
                    showMessage('No se recibió el token de autenticación', 'danger');
                    return false;
                }
                console.log('[AuthService.login] Calling setToken...');
                setToken(token);
                console.log('[AuthService.login] Token saved');
                this.saveSession({
                    email: user.email || email,
                    role: user.role || 'user',
                    auth: true
                });
                showMessage(payload?.message || 'Login exitoso', 'success');
                console.log('[AuthService.login] Redirecting to home...');
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
    getRoleFromCookie() {
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
        if (roleCookie) {
            return roleCookie.split('=')[1];
        }
        return 'user';
    }
    async signup(credentials) {
        try {
            console.log('[AuthService.signup] Starting signup...');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            console.log('[AuthService.signup] Response status:', response.status);
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : { message: await response.text() };
            console.log('[AuthService.signup] Payload:', { message: payload.message, hasToken: !!payload.token });
            if (response.ok) {
                const user = payload?.user || {};
                const token = payload?.token;
                if (token) {
                    console.log('[AuthService.signup] Calling setToken...');
                    setToken(token);
                    console.log('[AuthService.signup] Token saved');
                }
                else {
                    console.warn('[AuthService.signup] No token in payload!');
                }
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
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            removeAuthToken();
            this.clearSession();
            window.location.href = '/';
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
