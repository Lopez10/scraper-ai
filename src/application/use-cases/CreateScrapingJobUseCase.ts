import { ScrapingJob } from '../../domain/entities/ScrapingJob.js';
import type { ScrapingJobRepository } from '../../domain/repositories/ScrapingJobRepository.js';
import type { ScrapingService } from '../../domain/services/ScrapingService.js';
import { ScrapingJobId } from '../../domain/value-objects/ScrapingJobId.js';
import { ScrapingJobStatus } from '../../domain/value-objects/ScrapingJobStatus.js';
import { ScrapingTarget } from '../../domain/value-objects/ScrapingTarget.js';

export interface CreateScrapingJobRequest {
    url: string;
    selectors: Record<string, string>;
    waitForSelector?: string;
    timeout?: number;
    headers?: Record<string, string>;
    cookies?: Array<{ name: string; value: string; domain?: string }>;
}

export interface CreateScrapingJobResponse {
    jobId: string;
    status: string;
    createdAt: Date;
}

export class CreateScrapingJobUseCase {
    constructor(
        private readonly jobRepository: ScrapingJobRepository,
        private readonly scrapingService: ScrapingService
    ) { }

    async execute(request: CreateScrapingJobRequest): Promise<CreateScrapingJobResponse> {
        // Crear el target de scraping
        const target = new ScrapingTarget({
            url: request.url,
            selectors: request.selectors,
            waitForSelector: request.waitForSelector,
            timeout: request.timeout,
            headers: request.headers,
            cookies: request.cookies
        });

        // Validar que el target es accesible
        const isValid = await this.scrapingService.validateTarget(target);
        if (!isValid) {
            throw new Error(`No se puede acceder a la URL: ${request.url}`);
        }

        // Crear el job
        const jobId = new ScrapingJobId();
        const job = new ScrapingJob(
            jobId,
            target,
            ScrapingJobStatus.PENDING
        );

        // Guardar el job
        await this.jobRepository.save(job);

        return {
            jobId: jobId.value,
            status: job.status,
            createdAt: job.createdAt
        };
    }
}
