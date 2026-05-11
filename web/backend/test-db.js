const { createHandlerSQL } = require('./src/database/connection');
const { loadQueries } = require('./src/database/queries');
const path = require('path');
async function test() {
    console.log('🔍 Probando conexión a base de datos...');
    const dbPath = path.join(__dirname, '../../app/data/movieDB.db');
    const queriesPath = path.join(__dirname, './src/database/queries.json');
    console.log('📁 DB:', dbPath);
    console.log('📁 Queries:', queriesPath);
    const queries = loadQueries(queriesPath);
    console.log('📚 Queries cargadas:', Object.keys(queries).length);
    const db = createHandlerSQL(dbPath, queries);
    try {
        await db.connect();
        console.log('✅ Conexión OK');
        const result = await db.execute('SELECT 1', {});
        console.log('✅ Query de prueba OK');
        const genres = await db.execute('get_info_genre', {});
        console.log(`🎬 Géneros encontrados:`, genres ? genres.length : 0);
        if (genres && genres.length > 0) {
            console.log('Ejemplo:', genres[0]);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.close();
    }
}
test();
