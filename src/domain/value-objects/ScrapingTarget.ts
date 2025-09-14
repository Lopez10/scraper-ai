export interface ScrapingTargetConfig {
    url: string;
    selectors: Record<string, string>;
    waitForSelector?: string;
    timeout?: number;
    headers?: Record<string, string>;
    cookies?: Array<{ name: string; value: string; domain?: string }>;
}

export class ScrapingTarget {
    private readonly _url: string;
    private readonly _selectors: Record<string, string>;
    private readonly _waitForSelector?: string;
    private readonly _timeout: number;
    private readonly _headers?: Record<string, string>;
    private readonly _cookies?: Array<{ name: string; value: string; domain?: string }>;

    constructor(config: ScrapingTargetConfig) {
        this.validateUrl(config.url);
        this.validateSelectors(config.selectors);

        this._url = config.url;
        this._selectors = config.selectors;
        this._waitForSelector = config.waitForSelector;
        this._timeout = config.timeout || 30000; // 30 segundos por defecto
        this._headers = config.headers;
        this._cookies = config.cookies;
    }

    get url(): string {
        return this._url;
    }

    get selectors(): Record<string, string> {
        return { ...this._selectors };
    }

    get waitForSelector(): string | undefined {
        return this._waitForSelector;
    }

    get timeout(): number {
        return this._timeout;
    }

    get headers(): Record<string, string> | undefined {
        return this._headers ? { ...this._headers } : undefined;
    }

    get cookies(): Array<{ name: string; value: string; domain?: string }> | undefined {
        return this._cookies ? [...this._cookies] : undefined;
    }

    private validateUrl(url: string): void {
        try {
            new URL(url);
        } catch {
            throw new Error(`URL inválida: ${url}`);
        }
    }

    private validateSelectors(selectors: Record<string, string>): void {
        if (!selectors || Object.keys(selectors).length === 0) {
            throw new Error('Debe proporcionar al menos un selector');
        }
    }
}
