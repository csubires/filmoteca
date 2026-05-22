export class TokenManager {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
    }
    static getInstance() {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }
    saveToken(token) {
        try {
            sessionStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.TOKEN_KEY, token);
            console.log('[TokenManager] Token saved to sessionStorage/localStorage');
        }
        catch (error) {
            try {
                sessionStorage.setItem(this.TOKEN_KEY, token);
                console.log('[TokenManager] Token saved to sessionStorage');
            }
            catch (sessionError) {
                console.error('[TokenManager] Error saving token:', sessionError || error);
            }
        }
    }
    getToken() {
        try {
            return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
        }
        catch (error) {
            console.error('[TokenManager] Error retrieving token:', error);
            return null;
        }
    }
    hasToken() {
        return this.getToken() !== null;
    }
    clearToken() {
        try {
            sessionStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.TOKEN_KEY);
            console.log('[TokenManager] Token cleared');
        }
        catch (error) {
            console.error('[TokenManager] Error clearing token:', error);
        }
    }
    getAuthorizationHeader() {
        const token = this.getToken();
        return token ? `Bearer ${token}` : null;
    }
}
export const tokenManager = TokenManager.getInstance();
