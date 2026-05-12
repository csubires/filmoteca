import Fastify from 'fastify';
import crypto from 'crypto';

export default async function createFastifyApp(options = {}) {

	const {
		serviceName = 'unknown',
		enableSessions = false,
		corsOrigin = false,
		getSessionSecret = null,
	} = options;


	const loggerConfig = {
		level: 'warn'
	};

	const fastify = Fastify({
		logger: loggerConfig,
		trustProxy: true
	});


	if (corsOrigin) {
		const fastifyCors = await import('@fastify/cors');
		const origin = corsOrigin === true
			? true
			: corsOrigin;

		await fastify.register(fastifyCors.default, {
			origin: origin,
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token', 'Cookie'],
			exposedHeaders: ['Set-Cookie', 'Authorization']
		});
	}

	if (serviceName === 'api-gateway' || serviceName === 'auth-service') {
		const fastifyFormbody = await import('@fastify/formbody');
		await fastify.register(fastifyFormbody.default);
	}

if (enableSessions) {
  const fastifySecureSession = await import('@fastify/secure-session');

  if (!getSessionSecret) {
    throw new Error('getSessionSecret is required when enableSessions=true');
  }

  const sessionSecret = await getSessionSecret();

  let sessionKey;
  if (sessionSecret && sessionSecret.length >= 64) {
    sessionKey = Buffer.from(sessionSecret, 'hex');
  } else {
    console.warn('SESSION_SECRET not set or invalid, generating random session key');
    sessionKey = crypto.randomBytes(32);
  }

  await fastify.register(fastifySecureSession.default, {
    key: sessionKey,
    cookie: {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'none'
    },
    cookieName: 'sessionId',
    sessionName: 'session'
  });

  if (serviceName === 'api-gateway') {
    const fastifyPassport = await import('@fastify/passport');
    await fastify.register(fastifyPassport.default.initialize());
    await fastify.register(fastifyPassport.default.secureSession());
  }
}


	fastify.addHook('onReady', async () => {
		if (!fastify.hasRequestDecorator('isAuthenticated')) {
			fastify.decorateRequest('isAuthenticated', function () {
				return !!this.session?.userId ||
					!!this.session?.passport?.user ||
					!!this.user;
			});
		}
	});

	if (serviceName === 'api-gateway') {
		fastify.addHook('onRequest', async (request, reply) => {
			const startTime = Date.now();
			fastify.log.info({
				method: request.method,
				url: request.url,
				ip: request.ip,
				userAgent: request.headers['user-agent']
			}, 'Incoming request');
			reply.header('X-Request-ID', request.id);
			request.startTime = startTime;
		});

		fastify.addHook('onSend', async (request, reply, payload) => {
			if (request.startTime) {
				const responseTime = Date.now() - request.startTime;
				fastify.log.info({
					statusCode: reply.statusCode,
					responseTime: `${responseTime}ms`
				}, 'Request completed');
			}
		});
	}

	fastify.setErrorHandler(function (error, request, reply) {
		fastify.log.error({
			err: error,
			url: request.url,
			method: request.method
		}, 'Request error');
		const statusCode = error.statusCode || 500;
		const response = {
			error: 'common.internalError',
			code: 'INTERNAL_ERROR'
		};
		if (error.validation) {
			reply.status(422);
			response.error = 'validation.invalidInput';
			response.code = 'VALIDATION_ERROR';
			response.details = error.validation;
		}
		if (process.env.NODE_ENV === 'development') {
			response.message = error.message;
		}
		reply.status(statusCode).send(response);
	});

	fastify.setNotFoundHandler(function (request, reply) {
		reply.status(404).send({
			error: 'Route not found',
			path: request.url,
			code: 'ROUTE_NOT_FOUND'
		});
	});

	return fastify;
}
