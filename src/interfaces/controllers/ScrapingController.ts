import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateScrapingJobRequest } from '../../application/use-cases/CreateScrapingJobUseCase.js';
import { CreateScrapingJobUseCase } from '../../application/use-cases/CreateScrapingJobUseCase.js';
import { ExecuteScrapingJobUseCase } from '../../application/use-cases/ExecuteScrapingJobUseCase.js';
import { GetScrapingJobUseCase } from '../../application/use-cases/GetScrapingJobUseCase.js';

export class ScrapingController {
    constructor(
        private readonly createScrapingJobUseCase: CreateScrapingJobUseCase,
        private readonly executeScrapingJobUseCase: ExecuteScrapingJobUseCase,
        private readonly getScrapingJobUseCase: GetScrapingJobUseCase
    ) { }

    async createJob(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = request.body as CreateScrapingJobRequest;

            const result = await this.createScrapingJobUseCase.execute(body);

            reply.status(201).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.status(400).send({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    async executeJob(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { jobId } = request.params as { jobId: string };

            const result = await this.executeScrapingJobUseCase.execute({ jobId });

            reply.status(200).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.status(400).send({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    async getJob(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { jobId } = request.params as { jobId: string };

            const result = await this.getScrapingJobUseCase.execute({ jobId });

            reply.status(200).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.status(404).send({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
