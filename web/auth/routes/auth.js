import bcrypt from 'bcrypt';
import { databaseClient } from '../services/database-client.js';
import jwtService from '../services/jwt.js';
import { resolveAuthToken } from '../services/token.js';

// Email validation schema
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Get current timestamp with full precision
function getCurrentTimestamp() {
	return new Date().toISOString();
}

// Hash password
async function hashPassword(password) {
	return await bcrypt.hash(password, 10);
}

// Compare password
async function comparePassword(password, hash) {
	return await bcrypt.compare(password, hash);
}

// Get IP address
function getClientIp(request) {
	return request.headers['x-forwarded-for']?.split(',')[0] ||
		request.socket.remoteAddress ||
		'unknown';
}

// Get user agent
function getUserAgent(request) {
	return request.headers['user-agent'] || 'unknown';
}

export default async function authRoutes(fastify, options) {
	// Register endpoint
	fastify.post('/auth/register', async (request, reply) => {
		try {
			const { name, email, password, repeat_password } = request.body;

			// Validate input
			if (!name || !email || !password || !repeat_password) {
				return reply.status(400).send({
					error: 'Todos los campos son requeridos'
				});
			}

			if (password !== repeat_password) {
				return reply.status(400).send({
					error: 'Las contraseñas no coinciden'
				});
			}

			if (!isValidEmail(email)) {
				return reply.status(400).send({
					error: 'El correo electrónico no es válido'
				});
			}

			if (password.length < 8) {
				return reply.status(400).send({
					error: 'La contraseña debe tener al menos 8 caracteres'
				});
			}

			if (name.length < 4) {
				return reply.status(400).send({
					error: 'El nombre debe tener al menos 4 caracteres'
				});
			}

			// Check if user exists
			const existingUser = await databaseClient.userExists(email, name);

			if (existingUser?.data?.exists) {
				return reply.status(409).send({
					error: 'El usuario ya existe'
				});
			}

			// Hash password and store user
			const hashedPassword = await hashPassword(password);
			const ip = getClientIp(request);
			const agent = getUserAgent(request);
			const createdAt = getCurrentTimestamp();

			const result = await databaseClient.createUser({
				name,
				email,
				password: hashedPassword,
				ip,
				agent,
				created_at: createdAt,
				last_login: createdAt,
				role: 'user'
			});

			// Generate JWT token
			const token = await jwtService.generateToken({
				sub: email,
				name: name,
				role: 'user'
			});

			return reply.status(201).send({
				message: 'Usuario registrado exitosamente',
				token: token,
				user: {
					name: name,
					email: email,
					role: 'user',
					createdAt: createdAt
				}
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({
				error: 'Error en el registro'
			});
		}
	});

	// Login endpoint
	fastify.post('/auth/login', async (request, reply) => {
		try {
			const { email, password } = request.body;

			// Validate input
			if (!email || !password) {
				return reply.status(400).send({
					error: 'Email y contraseña son requeridos'
				});
			}

			if (!isValidEmail(email)) {
				return reply.status(400).send({
					error: 'El correo electrónico no es válido'
				});
			}

			// Check if user exists and get password
			const userResponse = await databaseClient.findUserByEmail(email);
			const user = userResponse?.data;

			if (!user) {
				return reply.status(401).send({
					error: 'Credenciales inválidas'
				});
			}

			// Compare password
			const validPassword = await comparePassword(password, user.password);
			if (!validPassword) {
				return reply.status(401).send({
					error: 'Credenciales inválidas'
				});
			}

			// Update last_login timestamp
			const lastLogin = getCurrentTimestamp();
			await databaseClient.updateLastLogin(user.id_user, lastLogin);

			// Generate JWT token
			const token = await jwtService.generateToken({
				sub: email,
				name: user.name,
				role: user.role || 'user'
			});

			return reply.send({
				message: 'Login exitoso',
				token: token,
				user: {
					name: user.name,
					email: email,
					role: user.role || 'user',
					lastLogin: lastLogin
				}
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({
				error: 'Error en el login'
			});
		}
	});

	// Verify token endpoint
	fastify.post('/auth/verify', async (request, reply) => {
		try {
			const token = resolveAuthToken(request);

			if (!token) {
				return reply.status(401).send({
					error: 'auth.authenticationRequired'
				});
			}

			try {
				const decoded = await jwtService.verifyToken(token);
				if (!decoded) {
					return reply.status(401).send({
						error: 'auth.invalidToken'
					});
				}
				return reply.send({
					valid: true,
					user: {
						email: decoded.sub,
						name: decoded.name,
						role: decoded.role
					}
				});
			} catch (verifyError) {
				return reply.status(401).send({
					error: 'auth.invalidToken'
				});
			}
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({
				error: 'Error al verificar token'
			});
		}
	});

	// Logout endpoint
	fastify.post('/auth/logout', async (request, reply) => {
		return reply.send({
			message: 'Logout exitoso'
		});
	});

	// Health check
	fastify.get('/auth/health', async (request, reply) => {
		return reply.send({
			service: 'auth-service',
			status: 'OK',
			timestamp: new Date().toISOString()
		});
	});
}
