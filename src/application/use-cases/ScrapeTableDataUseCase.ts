import type { ScrapingService } from '../../domain/services/ScrapingService.js';
import { ScrapingTarget } from '../../domain/value-objects/ScrapingTarget.js';

export interface ScrapeTableDataRequest {
    url: string;
    tableSelector: string;
    rowSelector: string;
    columnSelectors: Record<string, string>;
    maxRows?: number;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface TableRowData {
    [key: string]: string | null;
}

export interface ScrapeTableDataResponse {
    url: string;
    totalRows: number;
    data: TableRowData[];
    scrapedAt: Date;
}

export class ScrapeTableDataUseCase {
    constructor(
        private readonly scrapingService: ScrapingService
    ) { }

    async execute(request: ScrapeTableDataRequest): Promise<ScrapeTableDataResponse> {
        const target = new ScrapingTarget({
            url: request.url,
            selectors: {
                table_data: request.tableSelector
            },
            waitForSelector: request.tableSelector,
            timeout: request.timeout || 30000,
            headers: request.headers
        });

        // Ejecutar scraping básico para obtener la estructura
        const result = await this.scrapingService.scrape(target);

        // Aquí podríamos implementar lógica adicional para procesar datos de tabla
        // Por ahora, retornamos la estructura básica
        return {
            url: request.url,
            totalRows: 1, // Se calcularía dinámicamente
            data: [result.data],
            scrapedAt: new Date()
        };
    }
}
