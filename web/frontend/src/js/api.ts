const API_BASE = '';

// Custom error classes for different HTTP status codes
export class ValidationError extends Error {
	status: number = 422;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'ValidationError';
		this.code = code;
	}
}

export class ConflictError extends Error {
	status: number = 409;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'ConflictError';
		this.code = code;
	}
}

export class AuthError extends Error {
	status: number = 401;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'AuthError';
		this.code = code;
	}
}

export class ForbiddenError extends Error {
	status: number = 403;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'ForbiddenError';
		this.code = code;
	}
}

export class NotFoundError extends Error {
	status: number = 404;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'NotFoundError';
		this.code = code;
	}
}

export class ServerError extends Error {
	status: number = 500;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'ServerError';
		this.code = code;
	}
}

export class BadGatewayError extends Error {
	status: number = 502;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'BadGatewayError';
		this.code = code;
	}
}

export class ServiceUnavailableError extends Error {
	status: number = 503;
	code?: string;

	constructor(message: string, code?: string) {
		super(message);
		this.name = 'ServiceUnavailableError';
		this.code = code;
	}
}

// Fallback in-memory storage for private browsing mode
let memoryStorage: { [key: string]: string } = {};

// Check if storage is available
function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
	try {
		const storage = window[type];
		const test = '__storage_test__';
		storage.setItem(test, test);
		storage.removeItem(test);
		return true;
	} catch (e) {
		return false;
	}
}

// Use sessionStorage if available, fallback to memory
const useSessionStorage = isStorageAvailable('sessionStorage');
console.log('[api] useSessionStorage:', useSessionStorage);

function readTokenFromStorage(storage: Storage | null | undefined): string | null {
	if (!storage) {
		return null;
	}

	try {
		return storage.getItem('auth_token');
	} catch {
		return null;
	}
}

function getToken(): string | null {
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

function setToken(token: string): void {
	let persisted = false;

	try {
		window.sessionStorage.setItem('auth_token', token);
		persisted = true;
		console.log('[api.setToken] Saved to sessionStorage');
	} catch {
		// ignore storage failures and continue with fallback stores
	}

	try {
		window.localStorage.setItem('auth_token', token);
		persisted = true;
		console.log('[api.setToken] Saved to localStorage');
	} catch {
		// ignore storage failures and continue with fallback stores
	}

	if (!persisted) {
		memoryStorage['auth_token'] = token;
		console.log('[api.setToken] Saved to memory');
	}
	console.log('[api.setToken] Token length:', token.length);
}

function clearToken(): void {
	try {
		window.sessionStorage.removeItem('auth_token');
	} catch {
		// ignore
	}

	try {
		window.localStorage.removeItem('auth_token');
	} catch {
		// ignore
	}

	delete memoryStorage['auth_token'];
}

function removeAuthToken(): void {
	clearToken();
}

function getHeaders(): HeadersInit {
	const headers: Record<string, string> = {};

	const token = getToken();
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
		console.log('[api.getHeaders] Added Authorization header, token length:', token.length);
	} else {
		console.log('[api.getHeaders] No token found');
	}

	return headers;
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
	const isFormData = options.body instanceof FormData;

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...getHeaders(),
			...options.headers
		}
	});

	let data: any = null;
	try {
		data = await response.json();
	} catch {
		data = {};
	}

	// Handle authentication errors (token expired/invalid)
	if (response.status === 401 && data?.error === 'auth.invalidToken') {
		removeAuthToken();

		window.dispatchEvent(
			new CustomEvent('auth-expired', {
				detail: 'Your session has expired. Please login again.'
			})
		);

		throw new AuthError(data?.error || 'auth.invalidToken', data?.code);
	}

	// Throw specific error types based on status code
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

	return data as T;
}

export { api, getToken, setToken, clearToken, removeAuthToken, getHeaders };
