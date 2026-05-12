import createFastifyApp from './fastify-config.js';
import i18nRoutes from './routes/i18n.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startI18nService() {
	const fastify = await createFastifyApp({
		serviceName: 'i18n-service',
		corsOrigin: true
	});

	// Load all translation files
	const locales = {};
	const localesPath = path.join(__dirname, 'locales');
	try {
		const files = fs.readdirSync(localesPath);
		files.forEach(file => {
			if (file.endsWith('.json')) {
				const language = file.replace('.json', '');
				const filePath = path.join(localesPath, file);
				const content = fs.readFileSync(filePath, 'utf8');
				locales[language] = JSON.parse(content);
			}
		});
		Object.defineProperty(global, '__I18N_LOCALES__', { value: locales, configurable: true });
	} catch (error) {
		fastify.log.warn('Could not load translations:', error.message);
	}

	await fastify.register(i18nRoutes, { prefix: '/i18n' });
	await fastify.listen({ host: '0.0.0.0', port: 3002 });
	console.log('\n' + '='.repeat(50));
	console.log('i18n Service ready!');
	console.log(`Translations loaded: ${Object.keys(locales).join(', ')}`);
	console.log('Health: http://0.0.0.0:3002/i18n/health');
	console.log('='.repeat(50) + '\n');
}

startI18nService().catch(error => {
	console.error(error);
	process.exit(1);
});
