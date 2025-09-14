import { ScrapingResult } from '../value-objects/ScrapingResult.js';
import { ScrapingTarget } from '../value-objects/ScrapingTarget.js';

export interface ScrapingService {
    scrape(target: ScrapingTarget): Promise<ScrapingResult>;
    validateTarget(target: ScrapingTarget): Promise<boolean>;
}
