import { ScrapingJob } from '../../domain/entities/ScrapingJob.js';
import type { ScrapingJobRepository } from '../../domain/repositories/ScrapingJobRepository.js';
import { ScrapingJobId } from '../../domain/value-objects/ScrapingJobId.js';

export class InMemoryScrapingJobRepository implements ScrapingJobRepository {
    private jobs: Map<string, ScrapingJob> = new Map();

    async save(job: ScrapingJob): Promise<void> {
        this.jobs.set(job.id.value, job);
    }

    async findById(id: ScrapingJobId): Promise<ScrapingJob | null> {
        return this.jobs.get(id.value) || null;
    }

    async findAll(): Promise<ScrapingJob[]> {
        return Array.from(this.jobs.values());
    }

    async findByStatus(status: string): Promise<ScrapingJob[]> {
        return Array.from(this.jobs.values()).filter(job => job.status === status);
    }

    async delete(id: ScrapingJobId): Promise<void> {
        this.jobs.delete(id.value);
    }
}
