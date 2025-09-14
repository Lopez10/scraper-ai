export interface ScrapedData {
    [key: string]: string | number | boolean | null | ScrapedData | ScrapedData[];
}

export class ScrapingResult {
    private readonly _data: ScrapedData;
    private readonly _scrapedAt: Date;
    private readonly _url: string;
    private readonly _metadata: {
        responseTime: number;
        statusCode?: number;
        userAgent?: string;
    };

    constructor(
        data: ScrapedData,
        url: string,
        metadata: {
            responseTime: number;
            statusCode?: number;
            userAgent?: string;
        }
    ) {
        this._data = data;
        this._url = url;
        this._scrapedAt = new Date();
        this._metadata = metadata;
    }

    get data(): ScrapedData {
        return { ...this._data };
    }

    get scrapedAt(): Date {
        return this._scrapedAt;
    }

    get url(): string {
        return this._url;
    }

    get metadata() {
        return { ...this._metadata };
    }

    getField(fieldName: string): string | number | boolean | null | ScrapedData | ScrapedData[] | undefined {
        return this._data[fieldName];
    }

    hasField(fieldName: string): boolean {
        return fieldName in this._data;
    }

    toJSON(): string {
        return JSON.stringify({
            data: this._data,
            scrapedAt: this._scrapedAt.toISOString(),
            url: this._url,
            metadata: this._metadata
        });
    }
}
