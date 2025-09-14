import type { ScrapingJobRepository } from '../../domain/repositories/ScrapingJobRepository.js';
import { ScrapingJobId } from '../../domain/value-objects/ScrapingJobId.js';

export interface GetScrapingJobRequest {
    jobId: string;
}

export interface GetScrapingJobResponse {
    jobId: string;
    status: string;
    url: string;
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class GetScrapingJobUseCase {
    constructor(
        private readonly jobRepository: ScrapingJobRepository
    ) { }

    async execute(request: GetScrapingJobRequest): Promise<GetScrapingJobResponse> {
        const jobId = new ScrapingJobId(request.jobId);

        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            throw new Error(`Job no encontrado: ${request.jobId}`);
        }

        return {
            jobId: job.id.value,
            status: job.status,
            url: job.target.url,
            result: job.result?.data,
            error: job.error,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        };
    }
}
