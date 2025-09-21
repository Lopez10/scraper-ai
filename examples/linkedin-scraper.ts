#!/usr/bin/env tsx

/**
 * Ejemplo de scraping de LinkedIn
 * Este script demuestra cómo extraer posts de LinkedIn con autenticación
 */

import { chromium } from 'playwright';

interface LinkedInCredentials {
    email: string;
    password: string;
}

async function scrapeLinkedInPosts(profileUrl: string, credentials: LinkedInCredentials, maxPosts: number = 5) {
    const browser = await chromium.launch({
        headless: false, // Cambiar a true para modo headless
        slowMo: 2000, // Ralentizar para evitar detección
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();

    try {
        console.log('🔐 Iniciando login en LinkedIn...');

        // Configurar user agent realista
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // Navegar a LinkedIn
        await page.goto('https://www.linkedin.com/login', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Llenar formulario de login
        await page.waitForSelector('#username', { timeout: 30000 });
        await page.fill('#username', credentials.email);
        await page.waitForTimeout(1000);
        await page.fill('#password', credentials.password);
        await page.waitForTimeout(1000);

        console.log('📝 Credenciales ingresadas, haciendo login...');
        await page.click('button[type="submit"]');

        // Esperar a que se complete el login
        try {
            await page.waitForNavigation({
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
        } catch (error) {
            // Verificar si estamos logueados
            const currentUrl = page.url();
            if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
                console.log('✅ Login exitoso!');
            } else {
                throw new Error('❌ Error en el login. Verifica las credenciales o si hay CAPTCHA.');
            }
        }

        console.log('🔍 Navegando al perfil...');

        // Navegar al perfil objetivo
        const activityUrl = profileUrl + '/recent-activity/all/';
        await page.goto(activityUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Esperar a que se carguen los posts
        await page.waitForSelector('.feed-shared-update-v2, .occludable-update', { timeout: 30000 });

        console.log('📄 Extrayendo posts...');

        // Scroll para cargar más posts
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(3000);
        }

        // Extraer posts
        const posts = await page.evaluate((maxPosts) => {
            const postElements = document.querySelectorAll('.feed-shared-update-v2, .occludable-update');
            const posts = [];

            for (let i = 0; i < Math.min(postElements.length, maxPosts); i++) {
                const post = postElements[i];
                const content = post.querySelector('.feed-shared-text, .feed-shared-inline-show-more-text')?.textContent?.trim();
                const timestamp = post.querySelector('.feed-shared-actor__sub-description')?.textContent?.trim();

                if (content && content.length > 10) {
                    posts.push({
                        postNumber: i + 1,
                        content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                        timestamp,
                        fullContent: content
                    });
                }
            }

            return posts;
        }, maxPosts);

        return posts;

    } finally {
        await browser.close();
    }
}

// Ejecutar el scraping
async function main() {
    console.log('🚀 Iniciando scraping de LinkedIn...');

    // ⚠️ IMPORTANTE: Reemplaza con tus credenciales reales
    const credentials: LinkedInCredentials = {
        email: 'tu-email@ejemplo.com',
        password: 'tu-contraseña'
    };

    const profileUrl = 'https://www.linkedin.com/in';

    try {
        const posts = await scrapeLinkedInPosts(profileUrl, credentials, 5);

        console.log(`✅ Extraídos ${posts.length} posts de LinkedIn\n`);

        // Mostrar los posts
        console.log('📰 Posts de LinkedIn:');
        console.log('='.repeat(100));

        posts.forEach((post, index) => {
            console.log(`${post.postNumber}. ${post.content}`);
            console.log(`   ⏰ ${post.timestamp}`);
            console.log('');
        });

        // Guardar datos en JSON
        const fs = await import('fs/promises');
        await fs.writeFile(
            'linkedin-posts.json',
            JSON.stringify(posts, null, 2)
        );

        console.log('💾 Datos guardados en linkedin-posts.json');

    } catch (error) {
        console.error('❌ Error durante el scraping:', error);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { scrapeLinkedInPosts, type LinkedInCredentials };
