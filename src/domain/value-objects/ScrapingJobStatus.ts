export enum ScrapingJobStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export class ScrapingJobStatusVO {
    private readonly _value: ScrapingJobStatus;

    constructor(value: ScrapingJobStatus) {
        this._value = value;
    }

    get value(): ScrapingJobStatus {
        return this._value;
    }

    equals(other: ScrapingJobStatusVO): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
