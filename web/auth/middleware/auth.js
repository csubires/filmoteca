import jwtService from '../services/jwt.js';
import { resolveAuthToken } from '../services/token.js';

export async function authenticateJWT(request, reply) {
	const token = resolveAuthToken(request);

	if (!token) {
		return reply.status(401).send({
			success: false,
			error: 'auth.authenticationRequired'
		});
	}

	const decoded = await jwtService.verifyToken(token);

	if (!decoded) {
		return reply.status(401).send({
			success: false,
			error: 'auth.invalidToken'
		});
	}

	request.user = decoded;
}
