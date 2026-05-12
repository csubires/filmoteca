
import createFastifyApp from './fastify-config.js';
import healthRoutes from './routes/health.js';

async function startAuthService() {
	const fastify = await createFastifyApp({
		serviceName: 'auth-service',
		corsOrigin: true
	});

	// Register minimal routes for now - reserved for future expansion
	await fastify.register(healthRoutes, { prefix: '/auth' });

	await fastify.listen({ host: '0.0.0.0', port: 3001 });
	console.log('\n' + '='.repeat(50));
	console.log('Auth Service ready!');
	console.log('(Reserved for future authentication implementation)');
	console.log('Health: http://0.0.0.0:3001/auth/health');
	console.log('='.repeat(50) + '\n');
}

startAuthService().catch(error => {
	console.error(error);
	process.exit(1);
});
