import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import fastify from 'fastify';

// Domain & Application layers
import { CreateScrapingJobUseCase } from './application/use-cases/CreateScrapingJobUseCase.js';
import { ExecuteScrapingJobUseCase } from './application/use-cases/ExecuteScrapingJobUseCase.js';
import { GetScrapingJobUseCase } from './application/use-cases/GetScrapingJobUseCase.js';
import { InMemoryScrapingJobRepository } from './infrastructure/repositories/InMemoryScrapingJobRepository.js';
import { PlaywrightScrapingService } from './infrastructure/scrapers/PlaywrightScrapingService.js';
import { ScrapingController } from './interfaces/controllers/ScrapingController.js';
import { SP500Controller } from './interfaces/controllers/SP500Controller.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || 'localhost';

const server = async () => {
    const server = fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info'
        }
    });

    // Register middlewares
    server.register(formbody);
    server.register(cors);
    server.register(helmet);

    // Dependency Injection - Hexagonal Architecture
    const jobRepository = new InMemoryScrapingJobRepository();
    const scrapingService = new PlaywrightScrapingService();

    const createScrapingJobUseCase = new CreateScrapingJobUseCase(jobRepository, scrapingService);
    const executeScrapingJobUseCase = new ExecuteScrapingJobUseCase(jobRepository, scrapingService);
    const getScrapingJobUseCase = new GetScrapingJobUseCase(jobRepository);

    const scrapingController = new ScrapingController(
        createScrapingJobUseCase,
        executeScrapingJobUseCase,
        getScrapingJobUseCase
    );

    const sp500Controller = new SP500Controller();

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
                timestamp: new Date().toISOString(),
                service: 'inversion-scraper'
            });
        } catch (e) {
            reply.status(500).send({
                message: 'Health check endpoint failed.',
            });
        }
    });

    // Root route
    server.get('/', (request, reply) => {
        reply.status(200).send({
            message: 'Inversion Scraper API',
            version: '1.0.0',
            endpoints: {
                'POST /api/scraping/jobs': 'Crear un nuevo job de scraping',
                'POST /api/scraping/jobs/:jobId/execute': 'Ejecutar un job de scraping',
                'GET /api/scraping/jobs/:jobId': 'Obtener información de un job',
                'POST /api/sp500/scrape': 'Scraping completo del S&P 500',
                'GET /api/sp500/top-gainers': 'Top empresas ganadoras del S&P 500',
                'GET /health': 'Health check'
            }
        });
    });

    // Scraping API routes
    server.post('/api/scraping/jobs', (request, reply) =>
        scrapingController.createJob(request, reply)
    );

    server.post('/api/scraping/jobs/:jobId/execute', (request, reply) =>
        scrapingController.executeJob(request, reply)
    );

    server.get('/api/scraping/jobs/:jobId', (request, reply) =>
        scrapingController.getJob(request, reply)
    );

    // S&P 500 API routes
    server.post('/api/sp500/scrape', (request, reply) =>
        sp500Controller.scrapeSP500(request, reply)
    );

    server.get('/api/sp500/top-gainers', (request, reply) =>
        sp500Controller.getTopGainers(request, reply)
    );

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            try {
                server.log.info(`Cerrando aplicación en ${signal}...`);
                await scrapingService.close();
                await server.close();
                server.log.info(`Aplicación cerrada correctamente en ${signal}`);
                process.exit(0);
            } catch (err) {
                server.log.error(`Error cerrando aplicación en ${signal}: ${err}`);
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
        server.log.info(`🚀 Servidor ejecutándose en http://${host}:${port}`);
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
