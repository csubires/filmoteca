export default async function healthRoutes(fastify, options) {
	fastify.get('/health', async () => {
		return {
			service: 'auth-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			message: 'Auth service is running (future implementation)'
		};
	});
}
