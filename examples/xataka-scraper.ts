#!/usr/bin/env tsx

/**
 * Ejemplo de scraping de Xataka
 * Este script demuestra cómo extraer noticias y artículos de Xataka
 */

import { chromium } from 'playwright';

interface XatakaArticle {
    title: string;
    link: string;
    category?: string;
    excerpt?: string;
}

async function scrapeXatakaNews(): Promise<XatakaArticle[]> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Navegar a Xataka
        await page.goto('https://www.xataka.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Esperar a que la página se cargue
        await page.waitForSelector('h1, h2, h3', { timeout: 10000 });

        // Extraer artículos principales
        const articles: XatakaArticle[] = [];

        // Buscar títulos de artículos
        const titleElements = await page.$$('h1 a, h2 a, h3 a');

        for (let i = 0; i < Math.min(titleElements.length, 15); i++) {
            try {
                const element = titleElements[i];

                const title = await element.textContent();
                const link = await element.getAttribute('href');

                if (title && link && title.trim().length > 10) {
                    // Obtener enlace absoluto
                    const absoluteLink = link.startsWith('http') ? link : `https://www.xataka.com${link}`;

                    // Buscar categoría en el elemento padre
                    const parent = await element.evaluateHandle(el => el.closest('article, .article, .post'));
                    let category = '';

                    if (parent) {
                        try {
                            const categoryEl = await parent.$('.category, .tag, .section');
                            if (categoryEl) {
                                category = (await categoryEl.textContent())?.trim() || '';
                            }
                        } catch (error) {
                            // Ignorar errores
                        }
                    }

                    // Evitar duplicados
                    if (!articles.find(article => article.title === title.trim())) {
                        articles.push({
                            title: title.trim(),
                            link: absoluteLink,
                            category: category || undefined
                        });
                    }
                }
            } catch (error) {
                console.warn(`Error extrayendo artículo ${i}:`, error);
            }
        }

        return articles;

    } finally {
        await browser.close();
    }
}

// Ejecutar el scraping
async function main() {
    console.log('🚀 Iniciando scraping de Xataka...');

    try {
        const articles = await scrapeXatakaNews();

        console.log(`✅ Extraídos ${articles.length} artículos de Xataka\n`);

        // Mostrar los artículos
        console.log('📰 Artículos de Xataka:');
        console.log('='.repeat(100));

        articles.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title}`);
            console.log(`   🔗 ${article.link}`);
            if (article.category) {
                console.log(`   📂 Categoría: ${article.category}`);
            }
            console.log('');
        });

        // Guardar datos en JSON
        const fs = await import('fs/promises');
        await fs.writeFile(
            'xataka-articles.json',
            JSON.stringify(articles, null, 2)
        );

        console.log('💾 Datos guardados en xataka-articles.json');

    } catch (error) {
        console.error('❌ Error durante el scraping:', error);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { scrapeXatakaNews, type XatakaArticle };
