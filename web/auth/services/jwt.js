import jwt from 'jsonwebtoken';

class JWTService {
	constructor() {
		this.secret = null;
		this.loaded = false;
	}

	async loadSecret() {
		if (this.loaded) return;

		const jwtSecret = process.env.JWT_SECRET;

		if (!jwtSecret) {
			throw new Error('JWT_SECRET not found in environment');
		}

		this.secret = jwtSecret;
		this.loaded = true;
	}

	isValidTokenFormat(token) {
		return typeof token === 'string' && token.split('.').length === 3;
	}

	async generateToken(payload = {}, options = {}) {
		await this.loadSecret();

		return jwt.sign(payload, this.secret, {
			expiresIn: options.expiresIn ?? '7d',
			issuer: options.issuer ?? 'auth-service',
			audience: options.audience ?? 'user',
		});
	}

	async verifyToken(token, options = {}) {
		if (!this.isValidTokenFormat(token)) return null;

		await this.loadSecret();

		try {
			return jwt.verify(token, this.secret, {
				issuer: options.issuer ?? 'auth-service',
				audience: options.audience ?? 'user',
			});
		} catch {
			return null;
		}
	}

	decodeToken(token) {
		return this.isValidTokenFormat(token) ? jwt.decode(token) : null;
	}

	async refreshToken(oldToken, options = {}) {
		const payload = await this.verifyToken(oldToken);
		if (!payload) return null;

		delete payload.iat;
		delete payload.exp;

		return this.generateToken(payload, options);
	}
}

export default new JWTService();
