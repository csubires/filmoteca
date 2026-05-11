const fp = require('fastify-plugin');
const path = require('path');
const { createHandlerSQL } = require('../database/connection');
const { loadQueries } = require('../database/queries');
async function databaseConnector(fastify, options) {
    const dbPath = options.dbPath || process.env.DB_PATH || path.join(__dirname, '../../app/data/movieDB.db');
    fastify.log.info(`📦 Conectando a base de datos: ${dbPath}`);
    const queriesJsonPath = options.queriesJsonPath || path.join(__dirname, '../database/queries.json');
    fastify.log.info(`📖 Cargando queries desde: ${queriesJsonPath}`);
    const tagQuery = loadQueries(queriesJsonPath);
    if (Object.keys(tagQuery).length === 0) {
        fastify.log.warn('⚠️ No se cargaron queries. Verifica el archivo queries.json');
    } else {
        fastify.log.info(`✅ Cargadas ${Object.keys(tagQuery).length} queries`);
        const samples = Object.keys(tagQuery).slice(0, 5);
        fastify.log.debug('Ejemplos:', samples.join(', '));
    }
    try {
        const db = createHandlerSQL(dbPath, tagQuery);
        await db.connect();
        const testResult = await db.execute('SELECT 1', {});
        fastify.log.info('✅ Conexión a base de datos exitosa');
        fastify.decorate('db', db);
        fastify.addHook('onClose', async (instance) => {
            fastify.log.info('🔄 Cerrando conexión a base de datos...');
            await instance.db.close();
            fastify.log.info('✅ Conexión cerrada');
        });
    } catch (error) {
        fastify.log.error('❌ Error conectando a base de datos:', error);
        throw error;
    }
}
module.exports = fp(databaseConnector, {
    name: 'filmoteca-database',
    fastify: '5.x'
});
