#!/usr/bin/env tsx

/**
 * Ejemplo de scraping del S&P 500 desde SlickCharts
 * Este script demuestra cómo extraer datos de las primeras 20 empresas
 */

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

async function scrapeSP500Data(): Promise<SP500Company[]> {
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

        // Extraer datos de las primeras 20 empresas
        const companies: SP500Company[] = [];

        for (let i = 1; i <= 20; i++) {
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
                console.warn(`Error extrayendo empresa ${i}:`, error);
            }
        }

        return companies;

    } finally {
        await browser.close();
    }
}

// Ejecutar el scraping
async function main() {
    console.log('🚀 Iniciando scraping del S&P 500...');

    try {
        const companies = await scrapeSP500Data();

        console.log(`✅ Extraídas ${companies.length} empresas del S&P 500\n`);

        // Mostrar las primeras 10 empresas
        console.log('📊 Top 10 empresas del S&P 500:');
        console.log('='.repeat(80));
        console.log('Rank | Empresa                    | Símbolo | Peso    | Precio   | Cambio   | % Cambio');
        console.log('-'.repeat(80));

        companies.slice(0, 10).forEach(company => {
            console.log(
                `${company.rank.toString().padStart(4)} | ` +
                `${company.company.padEnd(25)} | ` +
                `${company.symbol.padEnd(7)} | ` +
                `${company.weight.padEnd(7)} | ` +
                `${company.price.padEnd(8)} | ` +
                `${company.change.padEnd(8)} | ` +
                `${company.percentChange}`
            );
        });

        // Guardar datos en JSON
        const fs = await import('fs/promises');
        await fs.writeFile(
            'sp500-data.json',
            JSON.stringify(companies, null, 2)
        );

        console.log('\n💾 Datos guardados en sp500-data.json');

    } catch (error) {
        console.error('❌ Error durante el scraping:', error);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { scrapeSP500Data, type SP500Company };
