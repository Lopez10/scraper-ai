import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateScrapingJobUseCase } from '../../src/application/use-cases/CreateScrapingJobUseCase.js';
import { ExecuteScrapingJobUseCase } from '../../src/application/use-cases/ExecuteScrapingJobUseCase.js';
import { GetScrapingJobUseCase } from '../../src/application/use-cases/GetScrapingJobUseCase.js';
import { InMemoryScrapingJobRepository } from '../../src/infrastructure/repositories/InMemoryScrapingJobRepository.js';
import { PlaywrightScrapingService } from '../../src/infrastructure/scrapers/PlaywrightScrapingService.js';
import { ScrapingController } from '../../src/interfaces/controllers/ScrapingController.js';

describe('ScrapingController Integration Tests', () => {
    let jobRepository: InMemoryScrapingJobRepository;
    let scrapingService: PlaywrightScrapingService;
    let controller: ScrapingController;

    beforeAll(async () => {
        jobRepository = new InMemoryScrapingJobRepository();
        scrapingService = new PlaywrightScrapingService();

        const createUseCase = new CreateScrapingJobUseCase(jobRepository, scrapingService);
        const executeUseCase = new ExecuteScrapingJobUseCase(jobRepository, scrapingService);
        const getUseCase = new GetScrapingJobUseCase(jobRepository);

        controller = new ScrapingController(createUseCase, executeUseCase, getUseCase);
    });

    afterAll(async () => {
        await scrapingService.close();
    });

    it('debería crear un job de scraping exitosamente', async () => {
        const mockRequest = {
            body: {
                url: 'https://httpbin.org/html',
                selectors: {
                    title: 'h1'
                }
            }
        } as any;

        const mockReply = {
            status: (code: number) => ({
                send: (data: any) => {
                    expect(code).toBe(201);
                    expect(data.success).toBe(true);
                    expect(data.data.jobId).toBeDefined();
                    expect(data.data.status).toBe('PENDING');
                }
            })
        } as any;

        await controller.createJob(mockRequest, mockReply);
    });

    it('debería obtener información de un job existente', async () => {
        // Primero crear un job
        const createRequest = {
            body: {
                url: 'https://httpbin.org/html',
                selectors: {
                    title: 'h1'
                }
            }
        } as any;

        let jobId: string;
        const createReply = {
            status: (code: number) => ({
                send: (data: any) => {
                    if (data.success) {
                        jobId = data.data.jobId;
                    }
                }
            })
        } as any;

        await controller.createJob(createRequest, createReply);

        // Luego obtener el job
        const getRequest = {
            params: { jobId }
        } as any;

        const getReply = {
            status: (code: number) => ({
                send: (data: any) => {
                    expect(code).toBe(200);
                    expect(data.success).toBe(true);
                    expect(data.data.jobId).toBe(jobId);
                    expect(data.data.status).toBe('PENDING');
                }
            })
        } as any;

        await controller.getJob(getRequest, getReply);
    });

    it('debería manejar error al crear job con URL inválida', async () => {
        const mockRequest = {
            body: {
                url: 'not-a-valid-url',
                selectors: {
                    title: 'h1'
                }
            }
        } as any;

        const mockReply = {
            status: (code: number) => ({
                send: (data: any) => {
                    expect(code).toBe(400);
                    expect(data.success).toBe(false);
                    expect(data.error).toContain('URL inválida');
                }
            })
        } as any;

        await controller.createJob(mockRequest, mockReply);
    });

    it('debería manejar error al obtener job inexistente', async () => {
        const mockRequest = {
            params: { jobId: 'non-existent-id' }
        } as any;

        const mockReply = {
            status: (code: number) => ({
                send: (data: any) => {
                    expect(code).toBe(404);
                    expect(data.success).toBe(false);
                    expect(data.error).toContain('Job no encontrado');
                }
            })
        } as any;

        await controller.getJob(mockRequest, mockReply);
    });
});
