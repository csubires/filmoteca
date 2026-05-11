import { Connection } from '../core/connection.js';
import { User } from '../types/api.types.js';
import { showMessage } from '../utils.js';

export interface LoginCredentials {
    email: string;
    password: string;
    csrf_token_form: string;
}

export interface SignupCredentials {
    name: string;
    email: string;
    password: string;
    repeat_password: string;
    csrf_token_form: string;
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

    constructor(connection: Connection) {
        this.connection = connection;
        this.loadSession();
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

    private getRoleFromCookie(): string {
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('user_role='));
        if (roleCookie) {
            return roleCookie.split('=')[1];
        }
        return 'user';
    }

    async login(email: string, password: string, csrfToken: string): Promise<boolean> {
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
                // Obtener rol de la cookie
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
                showMessage(errorMatch[2], errorMatch[1] as any);
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }

    async signup(credentials: SignupCredentials): Promise<boolean> {
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
                showMessage(errorMatch[2], errorMatch[1] as any);
            }
            return false;
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Error de conexión', 'danger');
            return false;
        }
    }

    async logout(): Promise<void> {
        try {
            await fetch('/logout');
            this.currentUser = null;
            sessionStorage.removeItem('user');
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

    getCsrfToken(): string | null {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag?.getAttribute('content') || null;
    }
}
