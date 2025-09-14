import { ScrapingJobId } from '../value-objects/ScrapingJobId.js';
import { ScrapingJobStatus } from '../value-objects/ScrapingJobStatus.js';
import { ScrapingResult } from '../value-objects/ScrapingResult.js';
import { ScrapingTarget } from '../value-objects/ScrapingTarget.js';

export class ScrapingJob {
    constructor(
        private readonly _id: ScrapingJobId,
        private readonly _target: ScrapingTarget,
        private _status: ScrapingJobStatus,
        private _result?: ScrapingResult,
        private _error?: string,
        private readonly _createdAt: Date = new Date(),
        private _updatedAt: Date = new Date()
    ) { }

    get id(): ScrapingJobId {
        return this._id;
    }

    get target(): ScrapingTarget {
        return this._target;
    }

    get status(): ScrapingJobStatus {
        return this._status;
    }

    get result(): ScrapingResult | undefined {
        return this._result;
    }

    get error(): string | undefined {
        return this._error;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    markAsRunning(): void {
        this._status = ScrapingJobStatus.RUNNING;
        this._updatedAt = new Date();
    }

    markAsCompleted(result: ScrapingResult): void {
        this._status = ScrapingJobStatus.COMPLETED;
        this._result = result;
        this._updatedAt = new Date();
    }

    markAsFailed(error: string): void {
        this._status = ScrapingJobStatus.FAILED;
        this._error = error;
        this._updatedAt = new Date();
    }

    isCompleted(): boolean {
        return this._status === ScrapingJobStatus.COMPLETED;
    }

    isFailed(): boolean {
        return this._status === ScrapingJobStatus.FAILED;
    }

    isRunning(): boolean {
        return this._status === ScrapingJobStatus.RUNNING;
    }

    isPending(): boolean {
        return this._status === ScrapingJobStatus.PENDING;
    }
}
