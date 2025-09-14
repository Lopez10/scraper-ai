import { describe, expect, it } from 'vitest';
import { ScrapingTarget } from '../../src/domain/value-objects/ScrapingTarget.js';

describe('ScrapingTarget', () => {
    it('debería crear un target válido con configuración básica', () => {
        const config = {
            url: 'https://example.com',
            selectors: {
                title: 'h1',
                content: '.content'
            }
        };

        const target = new ScrapingTarget(config);

        expect(target.url).toBe('https://example.com');
        expect(target.selectors).toEqual({
            title: 'h1',
            content: '.content'
        });
        expect(target.timeout).toBe(30000); // valor por defecto
    });

    it('debería crear un target con configuración completa', () => {
        const config = {
            url: 'https://example.com',
            selectors: {
                title: 'h1'
            },
            waitForSelector: '.main-content',
            timeout: 60000,
            headers: {
                'User-Agent': 'Custom Bot'
            },
            cookies: [
                { name: 'session', value: 'abc123' }
            ]
        };

        const target = new ScrapingTarget(config);

        expect(target.waitForSelector).toBe('.main-content');
        expect(target.timeout).toBe(60000);
        expect(target.headers).toEqual({ 'User-Agent': 'Custom Bot' });
        expect(target.cookies).toEqual([{ name: 'session', value: 'abc123' }]);
    });

    it('debería lanzar error con URL inválida', () => {
        const config = {
            url: 'not-a-valid-url',
            selectors: { title: 'h1' }
        };

        expect(() => new ScrapingTarget(config)).toThrow('URL inválida');
    });

    it('debería lanzar error sin selectores', () => {
        const config = {
            url: 'https://example.com',
            selectors: {}
        };

        expect(() => new ScrapingTarget(config)).toThrow('Debe proporcionar al menos un selector');
    });

    it('debería lanzar error con selectores nulos', () => {
        const config = {
            url: 'https://example.com',
            selectors: null as any
        };

        expect(() => new ScrapingTarget(config)).toThrow('Debe proporcionar al menos un selector');
    });
});
