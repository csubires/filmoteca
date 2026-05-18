import { fileURLToPath } from 'url';
import createFastifyApp from './fastify-config.js';
import fastifyStatic from '@fastify/static';
import gatewayRoutes from './routes/gateway.js';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUpstream = process.env.DATABASE_URL || 'http://localhost:3003';
const authUpstream = process.env.AUTH_URL || 'http://localhost:3001';
const i18nUpstream = process.env.I18N_URL || 'http://localhost:3002';

async function startGateway() {
	const fastify = await createFastifyApp({
		serviceName: 'api-gateway',
		corsOrigin: true
	});

	// Serve frontend static files
	const frontendPath = path.join(__dirname, '../frontend/public');
	await fastify.register(fastifyStatic, {
		root: frontendPath,
		prefix: '/',
		decorateReply: true,
		wildcard: true,
		list: false,
		setHeaders: (res, filePath) => {
			if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
				res.setHeader('Cache-Control', 'no-store');
			}
		}
	});

	// Serve poster images from data/posters
	fastify.get('/posters/*', (request, reply) => {
		const postersBase = path.join(__dirname, '../../data/posters');
		const rawPath = request.params['*'] || '';
		const relativePath = path.normalize(rawPath).replace(/^([/\\])+/, '');
		const originalFile = path.join(postersBase, relativePath);
		const cmpRelativePath = relativePath.replace(/(\.\w+)$/, '_cmp$1');
		const cmpFile = path.join(postersBase, cmpRelativePath);
		const resolvedBase = path.resolve(postersBase) + path.sep;
		const resolvedOriginal = path.resolve(originalFile);

		if (!resolvedOriginal.startsWith(resolvedBase)) {
			fastify.log.warn({ rawPath }, 'invalid poster path');
			return reply.code(400).send({ error: 'Invalid path' });
		}

		fastify.log.debug({ originalFile, cmpFile }, 'posters lookup');

		if (fs.existsSync(cmpFile)) {
			return reply.sendFile(cmpRelativePath, postersBase);
		}
		if (fs.existsSync(originalFile)) {
			return reply.sendFile(relativePath, postersBase);
		}
		fastify.log.warn({ rawPath }, 'poster not found');
		return reply.code(404).send({ error: 'Not found' });
	});

	// Gateway routes
	await fastify.register(gatewayRoutes, { prefix: '/gateway' });

	// Proxy function for backend services
	async function proxyAPI(request, reply, upstreamBase, pathPrefix = '') {
		try {
			let url = request.url.replace(/^\/api/, '');
			if (pathPrefix) {
				url = pathPrefix + url;
			}
			const target = `${upstreamBase}${url}`;
			const headers = {
				'Content-Type': request.headers['content-type'] || 'application/json'
			};

			let body;
			if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.body) {
				body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
			}

			// Log incoming request
			console.log(`\n[GATEWAY] ${request.method} ${request.url}`);
			console.log(`[GATEWAY] → Target: ${target}`);
			if (body) {
				console.log(`[GATEWAY] Body:`, body.length > 200 ? body.substring(0, 200) + '...' : body);
			}
			const startTime = Date.now();

			const upstreamRes = await fetch(target, {
				method: request.method,
				headers,
				body,
				redirect: 'manual'
			});

			const duration = Date.now() - startTime;

			if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
				const location = upstreamRes.headers.get('location');
				if (location) {
					console.log(`[GATEWAY] ✅ Response: ${upstreamRes.status} (${duration}ms) → Redirect: ${location}`);
					reply.code(upstreamRes.status);
					reply.header('location', location);
					return reply.send();
				}
			}

			const text = await upstreamRes.text();
			let data;
			try {
				data = text ? JSON.parse(text) : null;
			} catch {
				data = text;
			}

			console.log(`[GATEWAY] ✅ Response: ${upstreamRes.status} (${duration}ms)`);
			reply.code(upstreamRes.status);
			return reply.send(data);
		} catch (err) {
			console.error(`[GATEWAY] ❌ Error:`, err.message);
			fastify.log.error('Proxy error:', err);
			return reply.status(502).send({
				success: false,
				error: 'Service unavailable'
			});
		}
	}

	// API routing - proxy to microservices
	fastify.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		url: '/api/i18n/*',
		handler: async (request, reply) => {
			return proxyAPI(request, reply, i18nUpstream);
		}
	});

	fastify.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		url: '/api/auth/*',
		handler: async (request, reply) => {
			return proxyAPI(request, reply, authUpstream);
		}
	});

	fastify.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		url: '/api/database/*',
		handler: async (request, reply) => {
			return proxyAPI(request, reply, databaseUpstream);
		}
	});

	// Default /api/* routes proxy to database service with /database prefix
	fastify.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		url: '/api/*',
		handler: async (request, reply) => {
			return proxyAPI(request, reply, databaseUpstream, '/database');
		}
	});

	// SPA fallback - serve index.html for non-API routes
	fastify.setNotFoundHandler((request, reply) => {
		const url = request.url.split('?')[0];
		const isApi = url.startsWith('/api');
		const isStatic = /\.[a-zA-Z0-9]+$/.test(url);
		if (!isApi && !isStatic) {
			return reply.sendFile('index.html');
		}
		reply.code(404).send({ error: 'Not found' });
	});

	await fastify.listen({ host: '0.0.0.0', port: 3000 });
	console.log('\n' + '='.repeat(50));
	console.log('API Gateway ready!');
	console.log(`Frontend: http://0.0.0.0:3000`);
	console.log(`Database Service: ${databaseUpstream}`);
	console.log(`Auth Service: ${authUpstream}`);
	console.log(`i18n Service: ${i18nUpstream}`);
	console.log('='.repeat(50) + '\n');
}

startGateway().catch(error => {
	console.error(error);
	process.exit(1);
});
