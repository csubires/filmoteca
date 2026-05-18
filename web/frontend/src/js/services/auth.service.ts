import { Connection } from '../core/connection.js';
import { User } from '../types/api.types.js';
import { showMessage } from '../utils.js';

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
            } else {
                this.clearSession();
            }
        } catch {
            this.clearSession();
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
async login(email: string, password: string): Promise<boolean> {
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

    async signup(credentials: SignupCredentials): Promise<boolean> {
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
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }

    async logout(): Promise<void> {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            this.clearSession();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
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
