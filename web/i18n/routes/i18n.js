import i18n from '../services/i18n.js';

export default async function i18nRoutes(fastify, options) {
	const locales = global.__I18N_LOCALES__ || {};

	// Health check
	fastify.get('/health', async () => {
		return {
			service: 'i18n-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			languages: Object.keys(locales),
			loaded: Object.keys(locales).length > 0,
			endpoints: [
				'/i18n/translations',
				'/i18n/available-languages',
				'/i18n/locales/:language.json'
			]
		};
	});

	// Get translations for a language
	fastify.get('/translations', async (request, reply) => {
		const language = request.query.language || i18n.getLanguage() || 'en';
		const translations = i18n.locales[language] || locales[language];

		if (!translations) {
			return reply.status(404).send({
				success: false,
				error: 'Translations not found for language: ' + language
			});
		}

		return translations;
	});

	// Change current language
	fastify.post('/change-language', async (request, reply) => {
		const { language } = request.body;

		const allowedFields = ['language'];
		const receivedFields = Object.keys(request.body || {});
		const unexpectedFields = receivedFields.filter(f => !allowedFields.includes(f));
		if (unexpectedFields.length > 0) {
			return reply.status(422).send({
				success: false,
				error: 'validation.unexpectedFields',
				code: 'UNEXPECTED_FIELDS'
			});
		}

		if (!language || !Object.keys(locales).includes(language)) {
			return reply.status(422).send({
				success: false,
				error: 'common.unsupportedLanguage',
				code: 'UNSUPPORTED_LANGUAGE'
			});
		}

		i18n.setLanguage(language);

		if (request.session) {
			request.session.language = language;
		}

		return {
			success: true,
			message: 'Language changed',
			language: language
		};
	});

	// Get available languages
	fastify.get('/available-languages', async (request, reply) => {
		return {
			success: true,
			languages: Object.keys(locales).map(lang => ({
				code: lang,
				name: lang === 'en' ? 'English' : lang === 'es' ? 'Español' : 'English'
			})),
			current: i18n.getLanguage()
		};
	});

	// Get locale file
	fastify.get('/locales/:language.json', async (request, reply) => {
		const { language } = request.params;

		if (!Object.keys(locales).includes(language)) {
			return reply.status(404).send({ error: 'Language not found' });
		}

		const translations = locales[language];
		if (!translations) {
			return reply.status(404).send({ error: 'Translations not found' });
		}

		return translations;
	});
}
