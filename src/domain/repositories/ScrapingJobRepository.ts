import { ScrapingJob } from '../entities/ScrapingJob.js';
import { ScrapingJobId } from '../value-objects/ScrapingJobId.js';

export interface ScrapingJobRepository {
    save(job: ScrapingJob): Promise<void>;
    findById(id: ScrapingJobId): Promise<ScrapingJob | null>;
    findAll(): Promise<ScrapingJob[]>;
    findByStatus(status: string): Promise<ScrapingJob[]>;
    delete(id: ScrapingJobId): Promise<void>;
}
