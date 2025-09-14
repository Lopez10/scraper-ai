import type { FastifyReply, FastifyRequest } from 'fastify';
import { chromium } from 'playwright';

interface NewsArticle {
    title: string;
    link: string;
    excerpt?: string;
    category?: string;
    author?: string;
    publishedAt?: string;
    imageUrl?: string;
}

interface ScrapeNewsRequest {
    maxArticles?: number;
    includeContent?: boolean;
    category?: string;
}

export class NewsController {
    async scrapeXataka(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { maxArticles = 20, includeContent = false } = request.body as ScrapeNewsRequest;

            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            try {
                // Navegar a Xataka
                await page.goto('https://www.xataka.com', {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                // Esperar a que la página se cargue
                await page.waitForSelector('article, .article, h1, h2', { timeout: 10000 });

                // Extraer artículos principales
                const articles: NewsArticle[] = [];

                // Buscar títulos de artículos en diferentes selectores
                const titleSelectors = [
                    'h1 a',
                    'h2 a',
                    'h3 a',
                    '.article-title a',
                    '.entry-title a',
                    'article h2 a',
                    'article h3 a',
                    '.post-title a'
                ];

                for (const selector of titleSelectors) {
                    try {
                        const elements = await page.$$(selector);

                        for (let i = 0; i < Math.min(elements.length, maxArticles); i++) {
                            const element = elements[i];

                            const title = await element.textContent();
                            const link = await element.getAttribute('href');

                            if (title && link && title.trim().length > 10) {
                                // Obtener enlace absoluto
                                const absoluteLink = link.startsWith('http') ? link : `https://www.xataka.com${link}`;

                                // Buscar categoría y autor en el elemento padre
                                const parent = await element.evaluateHandle(el => el.closest('article, .article, .post'));
                                let category = '';
                                let author = '';

                                if (parent) {
                                    try {
                                        const categoryEl = await parent.$('.category, .tag, .section');
                                        if (categoryEl) {
                                            category = (await categoryEl.textContent())?.trim() || '';
                                        }

                                        const authorEl = await parent.$('.author, .byline, .writer');
                                        if (authorEl) {
                                            author = (await authorEl.textContent())?.trim() || '';
                                        }
                                    } catch (error) {
                                        // Ignorar errores al buscar metadatos
                                    }
                                }

                                // Evitar duplicados
                                if (!articles.find(article => article.title === title.trim())) {
                                    articles.push({
                                        title: title.trim(),
                                        link: absoluteLink,
                                        category: category || undefined,
                                        author: author || undefined
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Error con selector ${selector}:`, error);
                    }
                }

                // Extraer temas trending
                const trendingTopics: string[] = [];
                try {
                    const trendingElements = await page.$$('.trending-topics a, .hot-topics a, .popular-tags a');
                    for (const element of trendingElements) {
                        const text = await element.textContent();
                        if (text && text.trim().length > 0) {
                            trendingTopics.push(text.trim());
                        }
                    }
                } catch (error) {
                    console.warn('Error extrayendo trending topics:', error);
                }

                // Extraer categorías principales
                const categories: string[] = [];
                try {
                    const categoryElements = await page.$$('nav a, .menu a, .categories a');
                    for (const element of categoryElements) {
                        const text = await element.textContent();
                        if (text && text.trim().length > 0 && text.trim().length < 50) {
                            categories.push(text.trim());
                        }
                    }
                } catch (error) {
                    console.warn('Error extrayendo categorías:', error);
                }

                reply.status(200).send({
                    success: true,
                    data: {
                        articles: articles.slice(0, maxArticles),
                        trendingTopics: [...new Set(trendingTopics)].slice(0, 10),
                        categories: [...new Set(categories)].slice(0, 15),
                        totalArticles: articles.length,
                        scrapedAt: new Date().toISOString(),
                        source: 'https://www.xataka.com'
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

    async scrapeArticleContent(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { url } = request.body as { url: string };

            if (!url) {
                return reply.status(400).send({
                    success: false,
                    error: 'URL es requerida'
                });
            }

            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();

            try {
                await page.goto(url, {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                await page.waitForSelector('article, .article, .content, .post-content', { timeout: 10000 });

                // Extraer contenido del artículo
                const title = await page.textContent('h1, .article-title, .entry-title');
                const content = await page.textContent('article, .article-content, .post-content, .entry-content');
                const author = await page.textContent('.author, .byline, .writer');
                const publishedAt = await page.textContent('.date, .published, .timestamp');
                const category = await page.textContent('.category, .tag, .section');
                const excerpt = await page.textContent('.excerpt, .summary, .lead');

                reply.status(200).send({
                    success: true,
                    data: {
                        title: title?.trim(),
                        content: content?.trim(),
                        author: author?.trim(),
                        publishedAt: publishedAt?.trim(),
                        category: category?.trim(),
                        excerpt: excerpt?.trim(),
                        url: url,
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
