import { Connection } from '../core/connection.js';
import { User } from '../types/api.types.js';
import { showMessage } from '../utils.js';
import { setToken, getToken, removeAuthToken } from '../api.js';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    name: string;
    email: string;
    password: string;
    repeat_password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    role?: string;
    email?: string;
}

export class AuthService {
    private connection: Connection;
    private currentUser: User | null = null;
    readonly ready: Promise<void>;

    constructor(connection: Connection) {
        this.connection = connection;
        this.loadSession();
        this.ready = this.bootstrap();
    }

    private loadSession(): void {
        const sessionStr = sessionStorage.getItem('user');
        if (sessionStr) {
            try {
                this.currentUser = JSON.parse(sessionStr);
            } catch {
                this.currentUser = null;
            }
        }
    }

    private saveSession(user: User): void {
        this.currentUser = user;
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    private clearSession(): void {
        this.currentUser = null;
        sessionStorage.removeItem('user');
    }

    private async bootstrap(): Promise<void> {
        if (this.currentUser?.auth) return;

        try {
            const token = getToken();
            console.log('[AuthService.bootstrap] Token from storage:', { length: token?.length });

            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('[AuthService.bootstrap] Added Authorization header');
            } else {
                console.log('[AuthService.bootstrap] No token to add');
            }

            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers,
                body: JSON.stringify({})
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
            } else {
                removeAuthToken();
                this.clearSession();
            }
        } catch {
            removeAuthToken();
            this.clearSession();
        }
    }
    async login(email: string, password: string): Promise<boolean> {
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

            showMessage(
                payload?.error ||
                payload?.message ||
                'No se pudo iniciar sesión',
                'danger'
            );

            return false;

        } catch (error) {
            console.error('Login error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }

    private getRoleFromCookie(): string {
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
        if (roleCookie) {
            return roleCookie.split('=')[1];
        }
        return 'user';
    }

    async signup(credentials: SignupCredentials): Promise<boolean> {
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

                // Save token to sessionStorage/memory
                if (token) {
                    console.log('[AuthService.signup] Calling setToken...');
                    setToken(token);
                    console.log('[AuthService.signup] Token saved');
                } else {
                    console.warn('[AuthService.signup] No token in payload!');
                }

                showMessage(payload?.message || 'Usuario registrado exitosamente', 'success');
                window.location.href = '/login';
                return true;
            }

            showMessage(payload?.error || payload?.message || 'No se pudo registrar el usuario', 'danger');
            return false;
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }

    async logout(): Promise<void> {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear token from storage
            removeAuthToken();
            this.clearSession();
            window.location.href = '/';
        }
    }

    isAuthenticated(): boolean {
        return this.currentUser?.auth === true;
    }

    getUser(): User | null {
        return this.currentUser;
    }

    getFormToken(): string | null {
        return null;
    }
}
