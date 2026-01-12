import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeHonduras(targetDate = null) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Apply all optimizations
    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Honduras scraper - loteriasdehonduras.com');
        await page.goto('https://loteriasdehonduras.com/', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for results to load
        await page.waitForSelector('.game-block', { timeout: 30000 });

        // Get today's date in format DD-MM (e.g., "11-01" for January 11)
        const dateToUse = targetDate ? new Date(targetDate) : new Date();
        const todayStr = String(dateToUse.getDate()).padStart(2, '0') + '-' + String(dateToUse.getMonth() + 1).padStart(2, '0');

        // Extract results for La Diaria and Premia 2
        const results = await page.evaluate((todayStr) => {
            const gameBlocks = document.querySelectorAll('.game-block');
            const diariaResults = {};
            const premiaResults = {};

            gameBlocks.forEach(block => {
                const titleEl = block.querySelector('.game-title span');
                const dateEl = block.querySelector('.session-date');

                if (!titleEl || !dateEl) return;

                const titleText = titleEl.innerText.trim();
                const dateText = dateEl.innerText.trim();

                // Only process today's results
                if (dateText !== todayStr) return;

                // Extract time
                const timeMatch = titleText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
                if (!timeMatch) return;
                const time = timeMatch[1].trim();

                // Get numbers from .game-scores
                const scoreElements = block.querySelectorAll('.game-scores .score, .game-scores span');
                const numbers = Array.from(scoreElements)
                    .map(el => el.innerText.trim())
                    .filter(num => /^\d+$/.test(num));

                // Process La Diaria (first number only)
                if (titleText.includes('La Diaria')) {
                    if (numbers.length > 0) {
                        diariaResults[time] = numbers[0]; // First number only
                    }
                }

                // Process Premia 2 (2 numbers)
                if (titleText.includes('Premia 2')) {
                    if (numbers.length >= 2) {
                        premiaResults[time] = [numbers[0], numbers[1]]; // First 2 numbers
                    }
                }
            });

            return { diaria: diariaResults, premia: premiaResults };
        }, todayStr);

        await browser.close();

        // Combine La Diaria + Premia 2 for each time
        const times = ['11:00 AM', '3:00 PM', '9:00 PM'];
        const combinedResults = [];

        times.forEach(hondurasTime => {
            const diariaNum = results.diaria[hondurasTime];
            const premiaNum = results.premia[hondurasTime];

            if (diariaNum && premiaNum && premiaNum.length === 2) {
                // Convert Honduras time to Panama time
                const timeMap = {
                    '11:00 AM': '12:00 PM',
                    '3:00 PM': '4:00 PM',
                    '9:00 PM': '10:00 PM'
                };

                combinedResults.push({
                    time: timeMap[hondurasTime] || hondurasTime,
                    prizes: [diariaNum, premiaNum[0], premiaNum[1]]
                });
            }
        });

        console.log('Honduras scraping completed:', combinedResults);
        return combinedResults;

    } catch (error) {
        console.error('Error scraping Honduras:', error);
        await browser.close();
        return [];
    }
}
