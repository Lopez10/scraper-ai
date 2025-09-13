import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import fastify from 'fastify';
import pino from 'pino';

const port = Number(3000) || 5001;
const host = String('localhost');

const server = async () => {
    const server = fastify({
        logger: pino({ level: process.env.LOG_LEVEL }),
    });

    // Register middlewares
    server.register(formbody);
    server.register(cors);
    server.register(helmet);

    // Set error handler
    server.setErrorHandler((error, _request, reply) => {
        server.log.error(error);
        reply.status(500).send({ error: 'Something went wrong' });
    });

    // Health check route
    server.get('/health', async (_request, reply) => {
        try {
            reply.status(200).send({
                message: 'Health check endpoint success.',
            });
        } catch (e) {
            reply.status(500).send({
                message: 'Health check endpoint failed.',
            });
        }
    });

    // Root route
    server.get('/', (request, reply) => {
        reply.status(200).send({ message: 'Hello from fastify boilerplate!' });
    });

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            try {
                await server.close();
                server.log.error(`Closed application on ${signal}`);
                process.exit(0);
            } catch (err) {
                server.log.error(`Error closing application on ${signal} ${err}`);
                process.exit(1);
            }
        });
    });

    // Start server
    try {
        await server.listen({
            port,
            host,
        });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

server();
