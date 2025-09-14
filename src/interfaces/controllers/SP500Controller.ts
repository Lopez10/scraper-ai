import type { FastifyReply, FastifyRequest } from 'fastify';
import { chromium } from 'playwright';

interface SP500Company {
    rank: number;
    company: string;
    symbol: string;
    weight: string;
    price: string;
    change: string;
    percentChange: string;
}

interface ScrapeSP500Request {
    maxCompanies?: number;
    includeETFs?: boolean;
}

export class SP500Controller {
    async scrapeSP500(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { maxCompanies = 50, includeETFs = false } = request.body as ScrapeSP500Request;

            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            try {
                // Navegar a la página
                await page.goto('https://www.slickcharts.com/sp500', {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                // Esperar a que la tabla se cargue
                await page.waitForSelector('table tbody tr', { timeout: 10000 });

                // Extraer datos de las empresas
                const companies: SP500Company[] = [];
                const maxRows = Math.min(maxCompanies, 503); // Máximo 503 empresas

                for (let i = 1; i <= maxRows; i++) {
                    try {
                        const company = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(2) a`);
                        const symbol = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(3) a`);
                        const weight = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(4)`);
                        const price = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(5)`);
                        const change = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(6)`);
                        const percentChange = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(7)`);

                        if (company && symbol) {
                            companies.push({
                                rank: i,
                                company: company.trim(),
                                symbol: symbol.trim(),
                                weight: weight?.trim() || '',
                                price: price?.trim() || '',
                                change: change?.trim() || '',
                                percentChange: percentChange?.trim() || ''
                            });
                        }
                    } catch (error) {
                        // Si no hay más filas, salir del loop
                        break;
                    }
                }

                // Extraer ETFs si se solicita
                let etfs: any[] = [];
                if (includeETFs) {
                    try {
                        // Buscar todas las tablas y encontrar la que contiene ETFs
                        const tables = await page.$$('table');
                        let etfTable = null;

                        for (const table of tables) {
                            const tableText = await table.textContent();
                            if (tableText && tableText.includes('SPY') && tableText.includes('QQQ')) {
                                etfTable = table;
                                break;
                            }
                        }

                        if (etfTable) {
                            const spyPrice = await etfTable.$eval('tbody tr:nth-child(1) td:nth-child(3)', el => el.textContent?.trim() || '');
                            const qqqPrice = await etfTable.$eval('tbody tr:nth-child(2) td:nth-child(3)', el => el.textContent?.trim() || '');
                            const diaPrice = await etfTable.$eval('tbody tr:nth-child(3) td:nth-child(3)', el => el.textContent?.trim() || '');

                            etfs = [
                                { symbol: 'SPY', name: 'S&P 500 ETF', price: spyPrice },
                                { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: qqqPrice },
                                { symbol: 'DIA', name: 'Dow Jones ETF', price: diaPrice }
                            ];
                        } else {
                            // Fallback: buscar en la última tabla
                            const spyPrice = await page.textContent('table:last-of-type tbody tr:nth-child(1) td:nth-child(3)');
                            const qqqPrice = await page.textContent('table:last-of-type tbody tr:nth-child(2) td:nth-child(3)');
                            const diaPrice = await page.textContent('table:last-of-type tbody tr:nth-child(3) td:nth-child(3)');

                            etfs = [
                                { symbol: 'SPY', name: 'S&P 500 ETF', price: spyPrice?.trim() || '' },
                                { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: qqqPrice?.trim() || '' },
                                { symbol: 'DIA', name: 'Dow Jones ETF', price: diaPrice?.trim() || '' }
                            ];
                        }
                    } catch (error) {
                        console.warn('Error extrayendo ETFs:', error);
                    }
                }

                reply.status(200).send({
                    success: true,
                    data: {
                        companies,
                        etfs,
                        totalCompanies: companies.length,
                        scrapedAt: new Date().toISOString(),
                        source: 'https://www.slickcharts.com/sp500'
                    }
                });

            } finally {
                await browser.close();
            }

        } catch (error) {
            reply.status(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    async getTopGainers(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { limit = 10 } = request.query as { limit?: number };

            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            try {
                await page.goto('https://www.slickcharts.com/sp500', {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                await page.waitForSelector('table tbody tr', { timeout: 10000 });

                const gainers: SP500Company[] = [];

                for (let i = 1; i <= 50; i++) { // Revisar las primeras 50 empresas
                    try {
                        const percentChange = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(7)`);
                        const change = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(6)`);

                        // Filtrar solo empresas con cambio positivo
                        if (percentChange && !percentChange.includes('(-') && change && !change.startsWith('-')) {
                            const company = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(2) a`);
                            const symbol = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(3) a`);
                            const weight = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(4)`);
                            const price = await page.textContent(`table tbody tr:nth-child(${i}) td:nth-child(5)`);

                            if (company && symbol) {
                                gainers.push({
                                    rank: i,
                                    company: company.trim(),
                                    symbol: symbol.trim(),
                                    weight: weight?.trim() || '',
                                    price: price?.trim() || '',
                                    change: change.trim(),
                                    percentChange: percentChange.trim()
                                });
                            }
                        }
                    } catch (error) {
                        break;
                    }
                }

                // Ordenar por cambio porcentual descendente y tomar los primeros
                const sortedGainers = gainers
                    .sort((a, b) => {
                        const aChange = parseFloat(a.percentChange.replace(/[()%]/g, ''));
                        const bChange = parseFloat(b.percentChange.replace(/[()%]/g, ''));
                        return bChange - aChange;
                    })
                    .slice(0, limit);

                reply.status(200).send({
                    success: true,
                    data: {
                        gainers: sortedGainers,
                        total: sortedGainers.length,
                        scrapedAt: new Date().toISOString()
                    }
                });

            } finally {
                await browser.close();
            }

        } catch (error) {
            reply.status(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
