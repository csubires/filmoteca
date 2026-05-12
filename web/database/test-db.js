import { createHandlerSQL } from './connection.js';
import { loadQueries } from './queries.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
    console.log('🔍 Probando conexión a base de datos...');
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/movieDB.db');
    const queriesPath = process.env.QUERIES_PATH || path.join(__dirname, './queries.json');
    console.log('📁 DB:', dbPath);
    console.log('📁 Queries:', queriesPath);

    const queries = await loadQueries(queriesPath);
    console.log('📚 Queries cargadas:', Object.keys(queries).length);

    const db = createHandlerSQL(dbPath, queries);
    try {
        await db.connect();
        console.log('✅ Conexión OK');

        const result = await db.execute('SELECT 1', {});
        console.log('✅ Query de prueba OK');

        const genres = await db.execute('get_all_genres', {});
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

test().catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});
