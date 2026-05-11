const __path__ = require('path');
const fs = require('fs');
const fastifyStatic = require('@fastify/static');

async function staticRoutes(fastify, options) {
    const publicPath = __path__.join(__dirname, '../../frontend/public');

    await fastify.register(fastifyStatic, {
        root: publicPath,
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
fastify.get('/covers/*', (request, reply) => {
    const filePath = request.params['*'];
    const coversBase = __path__.join(publicPath, 'assets', 'covers');
    const originalFile = __path__.join(coversBase, filePath);
    const cmpFile = originalFile.replace(/(\.\w+)$/, '_cmp$1');

    fastify.log.debug({ originalFile, cmpFile }, 'covers lookup');

    if (fs.existsSync(cmpFile)) {
        return reply.sendFile(__path__.join('assets', 'covers', filePath).replace(/(\.\w+)$/, '_cmp$1'));
    }
    if (fs.existsSync(originalFile)) {
        return reply.sendFile(__path__.join('assets', 'covers', filePath));
    }
    fastify.log.warn({ filePath }, 'cover not found');
    reply.code(404).send({ error: 'Not found' });
});

    fastify.setNotFoundHandler((request, reply) => {
        const url = request.url.split('?')[0];
        const isApi = url.startsWith('/api');
        const isStatic = /\.[a-zA-Z0-9]+$/.test(url);
        if (!isApi && !isStatic) {
            return reply.sendFile('index.html');
        }
        reply.code(404).send({ error: 'Not found' });
    });
}

module.exports = staticRoutes;
