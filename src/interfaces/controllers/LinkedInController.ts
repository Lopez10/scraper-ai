import type { FastifyReply, FastifyRequest } from 'fastify';
import { chromium } from 'playwright';

interface LinkedInCredentials {
    email: string;
    password: string;
}

interface LinkedInScrapeRequest {
    profileUrl: string;
    credentials: LinkedInCredentials;
    maxPosts?: number;
}

interface LinkedInPost {
    content: string;
    timestamp: string;
    likes?: number;
    comments?: number;
    shares?: number;
    author: string;
}

export class LinkedInController {
    async scrapeLinkedInProfile(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { profileUrl, credentials, maxPosts = 10 } = request.body as LinkedInScrapeRequest;

            if (!credentials.email || !credentials.password) {
                return reply.status(400).send({
                    success: false,
                    error: 'Email y contraseña son requeridos'
                });
            }

            const browser = await chromium.launch({
                headless: false, // Cambiar a true para modo headless
                slowMo: 1000 // Ralentizar para evitar detección
            });
            const page = await browser.newPage();

            try {
                // Configurar user agent realista
                await page.setExtraHTTPHeaders({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                });

                // Navegar a LinkedIn
                await page.goto('https://www.linkedin.com/login', {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                // Esperar y llenar formulario de login
                await page.waitForSelector('#username', { timeout: 10000 });
                await page.fill('#username', credentials.email);
                await page.fill('#password', credentials.password);

                // Hacer clic en login
                await page.click('button[type="submit"]');

                // Esperar a que se complete el login
                await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

                // Verificar si el login fue exitoso
                const currentUrl = page.url();
                if (currentUrl.includes('/login') || currentUrl.includes('/challenge')) {
                    throw new Error('Error en el login. Verifica las credenciales o si hay CAPTCHA.');
                }

                // Navegar al perfil objetivo
                await page.goto(profileUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                // Esperar a que se cargue el perfil
                await page.waitForSelector('.pv-text-details__left-panel, .ph5', { timeout: 15000 });

                // Extraer información del perfil
                const profileInfo = await page.evaluate(() => {
                    const name = document.querySelector('h1')?.textContent?.trim() || '';
                    const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
                    const location = document.querySelector('.text-body-small')?.textContent?.trim() || '';

                    return { name, headline, location };
                });

                // Navegar a la sección de actividad
                const activityUrl = profileUrl.replace('/in/', '/in/') + '/recent-activity/all/';
                await page.goto(activityUrl, {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                // Esperar a que se carguen los posts
                await page.waitForSelector('.feed-shared-update-v2, .occludable-update', { timeout: 15000 });

                // Extraer posts
                const posts: LinkedInPost[] = [];

                // Scroll para cargar más posts
                for (let i = 0; i < 10; i++) {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await page.waitForTimeout(2000);

                    // Verificar si hay más contenido cargando
                    const isLoading = await page.evaluate(() => {
                        return document.querySelector('.feed-shared-loading-spinner') !== null;
                    });

                    if (!isLoading) {
                        await page.waitForTimeout(1000);
                    }
                }

                // Extraer datos de los posts
                const postElements = await page.$$('.feed-shared-update-v2, .occludable-update');

                for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
                    try {
                        const post = postElements[i];

                        const content = await post.$eval('.feed-shared-text, .feed-shared-inline-show-more-text',
                            el => el.textContent?.trim() || '');

                        const timestamp = await post.$eval('.feed-shared-actor__sub-description, .visually-hidden',
                            el => el.textContent?.trim() || '');

                        const likes = await post.$eval('.social-counts-reactions__count, .social-counts__item',
                            el => {
                                const text = el.textContent?.trim() || '';
                                const match = text.match(/(\d+)/);
                                return match ? parseInt(match[1]) : 0;
                            }).catch(() => 0);

                        const comments = await post.$eval('.social-counts-comments__count',
                            el => {
                                const text = el.textContent?.trim() || '';
                                const match = text.match(/(\d+)/);
                                return match ? parseInt(match[1]) : 0;
                            }).catch(() => 0);

                        if (content && content.length > 10) {
                            posts.push({
                                content,
                                timestamp,
                                likes,
                                comments,
                                author: profileInfo.name
                            });
                        }
                    } catch (error) {
                        console.warn(`Error extrayendo post ${i}:`, error);
                    }
                }

                reply.status(200).send({
                    success: true,
                    data: {
                        profile: profileInfo,
                        posts: posts,
                        totalPosts: posts.length,
                        scrapedAt: new Date().toISOString(),
                        source: profileUrl
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

    async scrapeLinkedInPosts(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { profileUrl, credentials, maxPosts = 20 } = request.body as LinkedInScrapeRequest;

            const browser = await chromium.launch({
                headless: false,
                slowMo: 2000, // Más lento para evitar detección
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            const page = await browser.newPage();

            try {
                // Configurar user agent y viewport
                await page.setExtraHTTPHeaders({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                });
                await page.setViewportSize({ width: 1366, height: 768 });

                // Login (mismo proceso que arriba)
                await page.goto('https://www.linkedin.com/login', {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                await page.waitForSelector('#username', { timeout: 30000 });
                await page.fill('#username', credentials.email);
                await page.waitForTimeout(1000);
                await page.fill('#password', credentials.password);
                await page.waitForTimeout(1000);
                await page.click('button[type="submit"]');

                // Esperar con timeout más largo
                try {
                    await page.waitForNavigation({
                        waitUntil: 'domcontentloaded',
                        timeout: 60000
                    });
                } catch (error) {
                    // Si hay timeout, verificar si estamos logueados
                    const currentUrl = page.url();
                    if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
                        // Estamos logueados, continuar
                    } else {
                        throw new Error('Error en el login. Verifica las credenciales o si hay CAPTCHA.');
                    }
                }

                // Navegar directamente a la actividad
                const activityUrl = profileUrl.endsWith('/')
                    ? profileUrl + 'recent-activity/all/'
                    : profileUrl + '/recent-activity/all/';
                await page.goto(activityUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                // Extraer posts con información completa
                const posts = await page.evaluate((maxPosts) => {
                    const postElements = document.querySelectorAll('.feed-shared-update-v2, .occludable-update');
                    const posts = [];

                    for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
                        const post = postElements[i];

                        // Contenido completo del post
                        const contentElement = post.querySelector('.feed-shared-text, .feed-shared-inline-show-more-text');
                        const content = contentElement?.textContent?.trim() || '';

                        // Timestamp
                        const timestamp = post.querySelector('.feed-shared-actor__sub-description, .visually-hidden')?.textContent?.trim() || '';

                        // Reacciones (likes, comentarios, compartidos)
                        const reactions = {
                            likes: 0,
                            comments: 0,
                            shares: 0
                        };

                        // Extraer likes
                        const likesElement = post.querySelector('.social-counts-reactions__count, .social-counts__item');
                        if (likesElement) {
                            const likesText = likesElement.textContent?.trim() || '';
                            const likesMatch = likesText.match(/(\d+)/);
                            if (likesMatch) {
                                reactions.likes = parseInt(likesMatch[1]);
                            }
                        }

                        // Extraer comentarios
                        const commentsElement = post.querySelector('.social-counts-comments__count');
                        if (commentsElement) {
                            const commentsText = commentsElement.textContent?.trim() || '';
                            const commentsMatch = commentsText.match(/(\d+)/);
                            if (commentsMatch) {
                                reactions.comments = parseInt(commentsMatch[1]);
                            }
                        }

                        // Extraer compartidos
                        const sharesElement = post.querySelector('.social-counts-shares__count');
                        if (sharesElement) {
                            const sharesText = sharesElement.textContent?.trim() || '';
                            const sharesMatch = sharesText.match(/(\d+)/);
                            if (sharesMatch) {
                                reactions.shares = parseInt(sharesMatch[1]);
                            }
                        }

                        // Autor del post
                        const authorElement = post.querySelector('.feed-shared-actor__name, .feed-shared-actor__title');
                        const author = authorElement?.textContent?.trim() || '';

                        // Imágenes del post
                        const images = [];
                        const imageElements = post.querySelectorAll('.feed-shared-image img, .feed-shared-video img');
                        imageElements.forEach(img => {
                            const src = img.getAttribute('src');
                            if (src) images.push(src);
                        });

                        // Enlaces del post
                        const links = [];
                        const linkElements = post.querySelectorAll('.feed-shared-text a, .feed-shared-inline-show-more-text a');
                        linkElements.forEach(link => {
                            const href = link.getAttribute('href');
                            const text = link.textContent?.trim();
                            if (href && text) links.push({ url: href, text });
                        });

                        if (content && content.length > 10) {
                            posts.push({
                                postNumber: i + 1,
                                content: content, // Contenido completo
                                timestamp,
                                author,
                                reactions,
                                images,
                                links,
                                wordCount: content.split(' ').length,
                                characterCount: content.length
                            });
                        }
                    }

                    return posts;
                }, maxPosts);

                reply.status(200).send({
                    success: true,
                    data: {
                        posts,
                        totalPosts: posts.length,
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
