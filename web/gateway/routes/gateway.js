export default async function gatewayRoutes(fastify, options) {
	fastify.get('/health', async () => ({
		service: 'api-gateway',
		status: 'OK',
		url: 'http://gateway:3000',
		timestamp: new Date().toISOString(),
		endpoints: [
			'/api/database',
			'/api/auth',
			'/api/i18n'
		]
	}));
}
