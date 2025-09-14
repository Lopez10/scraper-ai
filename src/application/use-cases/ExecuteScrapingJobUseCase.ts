import type { ScrapingJobRepository } from '../../domain/repositories/ScrapingJobRepository.js';
import type { ScrapingService } from '../../domain/services/ScrapingService.js';
import { ScrapingJobId } from '../../domain/value-objects/ScrapingJobId.js';

export interface ExecuteScrapingJobRequest {
    jobId: string;
}

export interface ExecuteScrapingJobResponse {
    jobId: string;
    status: string;
    result?: any;
    error?: string;
    completedAt: Date;
}

export class ExecuteScrapingJobUseCase {
    constructor(
        private readonly jobRepository: ScrapingJobRepository,
        private readonly scrapingService: ScrapingService
    ) { }

    async execute(request: ExecuteScrapingJobRequest): Promise<ExecuteScrapingJobResponse> {
        const jobId = new ScrapingJobId(request.jobId);

        // Buscar el job
        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            throw new Error(`Job no encontrado: ${request.jobId}`);
        }

        // Verificar que el job esté pendiente
        if (!job.isPending()) {
            throw new Error(`El job ya fue procesado. Estado actual: ${job.status}`);
        }

        try {
            // Marcar como ejecutándose
            job.markAsRunning();
            await this.jobRepository.save(job);

            // Ejecutar el scraping
            const result = await this.scrapingService.scrape(job.target);

            // Marcar como completado
            job.markAsCompleted(result);
            await this.jobRepository.save(job);

            return {
                jobId: job.id.value,
                status: job.status,
                result: result.data,
                completedAt: job.updatedAt
            };

        } catch (error) {
            // Marcar como fallido
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            job.markAsFailed(errorMessage);
            await this.jobRepository.save(job);

            return {
                jobId: job.id.value,
                status: job.status,
                error: errorMessage,
                completedAt: job.updatedAt
            };
        }
    }
}
