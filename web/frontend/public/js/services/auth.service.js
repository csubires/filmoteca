import { showMessage } from '../utils.js';
export class AuthService {
    constructor(connection) {
        this.currentUser = null;
        this.connection = connection;
        this.loadSession();
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
    getRoleFromCookie() {
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
        if (roleCookie) {
            return roleCookie.split('=')[1];
        }
        return 'user';
    }
    async login(email, password, csrfToken) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('csrf_token_form', csrfToken);
        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: formData
            });
            if (response.redirected) {
                const role = this.getRoleFromCookie();
                this.currentUser = {
                    email: email,
                    role: role,
                    auth: true
                };
                this.saveSession(this.currentUser);
                window.location.href = response.url;
                return true;
            }
            const html = await response.text();
            const errorMatch = html.match(/alert alert-(\w+)["']?>(.*?)<\/div>/);
            if (errorMatch) {
                showMessage(errorMatch[2], errorMatch[1]);
            }
            return false;
        }
        catch (error) {
            console.error('Login error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }
    async signup(credentials) {
        const formData = new FormData();
        Object.entries(credentials).forEach(([key, value]) => {
            formData.append(key, value);
        });
        try {
            const response = await fetch('/signup', {
                method: 'POST',
                body: formData
            });
            if (response.redirected) {
                window.location.href = response.url;
                return true;
            }
            const html = await response.text();
            const errorMatch = html.match(/alert alert-(\w+)["']?>(.*?)<\/div>/);
            if (errorMatch) {
                showMessage(errorMatch[2], errorMatch[1]);
            }
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
            await fetch('/logout');
            this.currentUser = null;
            sessionStorage.removeItem('user');
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
    getCsrfToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag?.getAttribute('content') || null;
    }
}
