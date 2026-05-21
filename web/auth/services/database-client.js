const databaseBaseUrl = (process.env.DATABASE_SERVICE_URL || process.env.DATABASE_URL || 'http://localhost:3003').replace(/\/$/, '');
const internalPrefix = '/database/internal/auth';

async function parseResponse(response) {
	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json') ? await response.json() : { message: await response.text() };

	if (!response.ok) {
		const error = new Error(payload.message || payload.error || 'Database service error');
		error.status = response.status;
		error.data = payload.data;
		throw error;
	}

	return payload;
}

export class DatabaseClient {
	constructor(baseUrl = databaseBaseUrl) {
		this.baseUrl = baseUrl;
	}

	async request(path, options = {}) {
		const response = await fetch(`${this.baseUrl}${internalPrefix}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			},
			...options
		});
		return parseResponse(response);
	}

	async findUserByEmail(email) {
		const query = new URLSearchParams({ email });
		const response = await fetch(`${this.baseUrl}${internalPrefix}/user?${query.toString()}`);
		return parseResponse(response);
	}

	async userExists(email, name) {
		const query = new URLSearchParams({ email, name });
		const response = await fetch(`${this.baseUrl}${internalPrefix}/user/exists?${query.toString()}`);
		return parseResponse(response);
	}

	async createUser(payload) {
		return this.request('/user', {
			method: 'POST',
			body: JSON.stringify(payload)
		});
	}

	async updateLastLogin(idUser, lastLogin) {
		return this.request('/user/last-login', {
			method: 'PATCH',
			body: JSON.stringify({ id_user: idUser, last_login: lastLogin })
		});
	}
}

export const databaseClient = new DatabaseClient();
