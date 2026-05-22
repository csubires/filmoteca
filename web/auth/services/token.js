function readCookieToken(cookieHeader, cookieName) {
	if (!cookieHeader) return null;

	const cookies = String(cookieHeader).split(';');
	for (const cookie of cookies) {
		const [rawKey, ...rest] = cookie.split('=');
		if (!rawKey) continue;
		if (rawKey.trim() === cookieName) {
			return decodeURIComponent(rest.join('=').trim());
		}
	}

	return null;
}

export function resolveAuthToken(request) {
	const authHeader = request.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.slice(7).trim();
		console.log('[AUTH] Resolved token from Authorization header');
		return token;
	}

	if (request.cookies?.auth_token) {
		console.log('[AUTH] Resolved token from request.cookies');
		return request.cookies.auth_token;
	}

	const cookieRaw = readCookieToken(request.headers.cookie, 'auth_token');
	if (cookieRaw) {
		console.log('[AUTH] Resolved token from raw Cookie header');
		return cookieRaw;
	}

	console.log('[AUTH] No token found in:', {
		hasAuthHeader: !!request.headers.authorization,
		hasCookiesObj: !!request.cookies,
		hasCookieHeader: !!request.headers.cookie
	});
	return null;
}
