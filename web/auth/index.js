
import 'dotenv/config';
import createFastifyApp from './fastify-config.js';
import authRoutes from './routes/auth.js';
import fastifyJwt from '@fastify/jwt';

async function startAuthService() {
	try {
		const fastify = await createFastifyApp({
			serviceName: 'auth-service',
			corsOrigin: true,
			enableJWT: false
		});

		await fastify.register(fastifyJwt, {
			secret: process.env.JWT_SECRET || 'change-this-secret-in-production'
		});

		// Register auth routes
		await fastify.register(authRoutes);

		// Graceful shutdown
		const signals = ['SIGTERM', 'SIGINT'];
		signals.forEach(signal => {
			process.on(signal, async () => {
				console.log(`\nReceived ${signal}, shutting down...`);
				await fastify.close();
				process.exit(0);
			});
		});

		await fastify.listen({ host: '0.0.0.0', port: 3001 });
		console.log('\n' + '='.repeat(50));
		console.log('Auth Service ready!');
		console.log('Register: POST http://0.0.0.0:3001/auth/register');
		console.log('Login: POST http://0.0.0.0:3001/auth/login');
		console.log('Verify: POST http://0.0.0.0:3001/auth/verify');
		console.log('Health: GET http://0.0.0.0:3001/auth/health');
		console.log('='.repeat(50) + '\n');
	} catch (error) {
		console.error('Failed to start auth service:', error);
		process.exit(1);
	}
}

startAuthService().catch(error => {
	console.error(error);
	process.exit(1);
});
