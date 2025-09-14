import { describe, expect, it } from 'vitest';
import { ScrapingJob } from '../../src/domain/entities/ScrapingJob.js';
import { ScrapingJobId } from '../../src/domain/value-objects/ScrapingJobId.js';
import { ScrapingJobStatus } from '../../src/domain/value-objects/ScrapingJobStatus.js';
import { ScrapingResult } from '../../src/domain/value-objects/ScrapingResult.js';
import { ScrapingTarget } from '../../src/domain/value-objects/ScrapingTarget.js';

describe('ScrapingJob', () => {
    const createMockTarget = () => new ScrapingTarget({
        url: 'https://example.com',
        selectors: { title: 'h1' }
    });

    const createMockResult = () => new ScrapingResult(
        { title: 'Test Title' },
        'https://example.com',
        { responseTime: 1000 }
    );

    it('debería crear un job con estado PENDING', () => {
        const jobId = new ScrapingJobId();
        const target = createMockTarget();
        const job = new ScrapingJob(jobId, target, ScrapingJobStatus.PENDING);

        expect(job.id).toBe(jobId);
        expect(job.target).toBe(target);
        expect(job.status).toBe(ScrapingJobStatus.PENDING);
        expect(job.isPending()).toBe(true);
        expect(job.isRunning()).toBe(false);
        expect(job.isCompleted()).toBe(false);
        expect(job.isFailed()).toBe(false);
    });

    it('debería marcar job como ejecutándose', () => {
        const jobId = new ScrapingJobId();
        const target = createMockTarget();
        const job = new ScrapingJob(jobId, target, ScrapingJobStatus.PENDING);

        job.markAsRunning();

        expect(job.status).toBe(ScrapingJobStatus.RUNNING);
        expect(job.isRunning()).toBe(true);
        expect(job.isPending()).toBe(false);
    });

    it('debería marcar job como completado', () => {
        const jobId = new ScrapingJobId();
        const target = createMockTarget();
        const result = createMockResult();
        const job = new ScrapingJob(jobId, target, ScrapingJobStatus.RUNNING);

        job.markAsCompleted(result);

        expect(job.status).toBe(ScrapingJobStatus.COMPLETED);
        expect(job.result).toBe(result);
        expect(job.isCompleted()).toBe(true);
        expect(job.isRunning()).toBe(false);
    });

    it('debería marcar job como fallido', () => {
        const jobId = new ScrapingJobId();
        const target = createMockTarget();
        const job = new ScrapingJob(jobId, target, ScrapingJobStatus.RUNNING);
        const errorMessage = 'Network timeout';

        job.markAsFailed(errorMessage);

        expect(job.status).toBe(ScrapingJobStatus.FAILED);
        expect(job.error).toBe(errorMessage);
        expect(job.isFailed()).toBe(true);
        expect(job.isRunning()).toBe(false);
    });

    it('debería actualizar updatedAt al cambiar estado', () => {
        const jobId = new ScrapingJobId();
        const target = createMockTarget();
        const job = new ScrapingJob(jobId, target, ScrapingJobStatus.PENDING);

        const originalUpdatedAt = job.updatedAt;

        // Esperar un poco para asegurar diferencia en timestamps
        setTimeout(() => {
            job.markAsRunning();
            expect(job.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 1);
    });
});
