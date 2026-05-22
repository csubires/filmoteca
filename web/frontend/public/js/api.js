const API_BASE = '';
export class ValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 422;
        this.name = 'ValidationError';
        this.code = code;
    }
}
export class ConflictError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 409;
        this.name = 'ConflictError';
        this.code = code;
    }
}
export class AuthError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 401;
        this.name = 'AuthError';
        this.code = code;
    }
}
export class ForbiddenError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 403;
        this.name = 'ForbiddenError';
        this.code = code;
    }
}
export class NotFoundError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 404;
        this.name = 'NotFoundError';
        this.code = code;
    }
}
export class ServerError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 500;
        this.name = 'ServerError';
        this.code = code;
    }
}
export class BadGatewayError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 502;
        this.name = 'BadGatewayError';
        this.code = code;
    }
}
export class ServiceUnavailableError extends Error {
    constructor(message, code) {
        super(message);
        this.status = 503;
        this.name = 'ServiceUnavailableError';
        this.code = code;
    }
}
let memoryStorage = {};
function isStorageAvailable(type) {
    try {
        const storage = window[type];
        const test = '__storage_test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
    }
    catch (e) {
        return false;
    }
}
const useSessionStorage = isStorageAvailable('sessionStorage');
console.log('[api] useSessionStorage:', useSessionStorage);
function readTokenFromStorage(storage) {
    if (!storage) {
        return null;
    }
    try {
        return storage.getItem('auth_token');
    }
    catch {
        return null;
    }
}
function getToken() {
    const sessionToken = readTokenFromStorage(window.sessionStorage);
    if (sessionToken) {
        console.log('[api.getToken] sessionStorage token:', { length: sessionToken.length });
        return sessionToken;
    }
    const localToken = readTokenFromStorage(window.localStorage);
    if (localToken) {
        console.log('[api.getToken] localStorage token:', { length: localToken.length });
        return localToken;
    }
    if (useSessionStorage) {
        console.log('[api.getToken] sessionStorage token:', { length: sessionToken?.length });
    }
    const token = memoryStorage['auth_token'] || null;
    console.log('[api.getToken] memory token:', { length: token?.length });
    return token;
}
function setToken(token) {
    let persisted = false;
    try {
        window.sessionStorage.setItem('auth_token', token);
        persisted = true;
        console.log('[api.setToken] Saved to sessionStorage');
    }
    catch {
    }
    try {
        window.localStorage.setItem('auth_token', token);
        persisted = true;
        console.log('[api.setToken] Saved to localStorage');
    }
    catch {
    }
    if (!persisted) {
        memoryStorage['auth_token'] = token;
        console.log('[api.setToken] Saved to memory');
    }
    console.log('[api.setToken] Token length:', token.length);
}
function clearToken() {
    try {
        window.sessionStorage.removeItem('auth_token');
    }
    catch {
    }
    try {
        window.localStorage.removeItem('auth_token');
    }
    catch {
    }
    delete memoryStorage['auth_token'];
}
function removeAuthToken() {
    clearToken();
}
function getHeaders() {
    const headers = {};
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[api.getHeaders] Added Authorization header, token length:', token.length);
    }
    else {
        console.log('[api.getHeaders] No token found');
    }
    return headers;
}
async function api(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...getHeaders(),
            ...options.headers
        }
    });
    let data = null;
    try {
        data = await response.json();
    }
    catch {
        data = {};
    }
    if (response.status === 401 && data?.error === 'auth.invalidToken') {
        removeAuthToken();
        window.dispatchEvent(new CustomEvent('auth-expired', {
            detail: 'Your session has expired. Please login again.'
        }));
        throw new AuthError(data?.error || 'auth.invalidToken', data?.code);
    }
    if (!response.ok) {
        const errorMessage = data?.error || 'common.requestFailed';
        const errorCode = data?.code;
        switch (response.status) {
            case 422:
                throw new ValidationError(errorMessage, errorCode);
            case 409:
                throw new ConflictError(errorMessage, errorCode);
            case 401:
                throw new AuthError(errorMessage, errorCode);
            case 403:
                throw new ForbiddenError(errorMessage, errorCode);
            case 404:
                throw new NotFoundError(errorMessage, errorCode);
            case 500:
            case 502:
            case 503:
                throw new ServerError(errorMessage, errorCode);
            default:
                throw new Error(errorMessage);
        }
    }
    return data;
}
export { api, getToken, setToken, clearToken, removeAuthToken, getHeaders };
