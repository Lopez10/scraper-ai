import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';
import type { ScrapingService } from '../../domain/services/ScrapingService.js';
import { ScrapingResult } from '../../domain/value-objects/ScrapingResult.js';
import { ScrapingTarget } from '../../domain/value-objects/ScrapingTarget.js';

export class PlaywrightScrapingService implements ScrapingService {
    private browser: Browser | null = null;

    async scrape(target: ScrapingTarget): Promise<ScrapingResult> {
        const startTime = Date.now();
        let page: Page | null = null;

        try {
            // Inicializar browser si no está abierto
            if (!this.browser) {
                this.browser = await chromium.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            page = await this.browser.newPage();

            // Configurar headers si existen
            if (target.headers) {
                await page.setExtraHTTPHeaders(target.headers);
            }

            // Configurar cookies si existen
            if (target.cookies) {
                await page.context().addCookies(
                    target.cookies.map(cookie => ({
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain || new URL(target.url).hostname,
                        path: '/'
                    }))
                );
            }

            // Navegar a la página
            const response = await page.goto(target.url, {
                waitUntil: 'networkidle',
                timeout: target.timeout
            });

            // Esperar selector específico si se proporciona
            if (target.waitForSelector) {
                await page.waitForSelector(target.waitForSelector, {
                    timeout: target.timeout
                });
            }

            // Extraer datos usando los selectores
            const scrapedData: Record<string, any> = {};

            for (const [fieldName, selector] of Object.entries(target.selectors)) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const text = await element.textContent();
                        scrapedData[fieldName] = text?.trim() || null;
                    } else {
                        scrapedData[fieldName] = null;
                    }
                } catch (error) {
                    console.warn(`Error extrayendo campo ${fieldName} con selector ${selector}:`, error);
                    scrapedData[fieldName] = null;
                }
            }

            const responseTime = Date.now() - startTime;

            return new ScrapingResult(
                scrapedData,
                target.url,
                {
                    responseTime,
                    statusCode: response?.status(),
                    userAgent: await page.evaluate(() => navigator.userAgent)
                }
            );

        } catch (error) {
            throw new Error(`Error durante el scraping: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    async validateTarget(target: ScrapingTarget): Promise<boolean> {
        let page: Page | null = null;

        try {
            if (!this.browser) {
                this.browser = await chromium.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            page = await this.browser.newPage();

            // Intentar navegar a la URL
            const response = await page.goto(target.url, {
                waitUntil: 'domcontentloaded',
                timeout: 10000 // 10 segundos para validación
            });

            return response?.status() === 200;

        } catch (error) {
            console.warn(`Error validando target ${target.url}:`, error);
            return false;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
