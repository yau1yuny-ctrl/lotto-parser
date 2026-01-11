import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeDominicanRepublic() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Apply all optimizations
    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Dominican Republic scraper - loteriasdominicanas.com');
        await page.goto('https://loteriasdominicanas.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Wait for game blocks to load
        await page.waitForSelector('.game-block', { timeout: 45000 });

        // Get today's date in DD-MM format
        const today = new Date();
        const todayStr = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0');

        // Extract La Primera results
        const results = await page.evaluate((todayStr) => {
            const gameBlocks = document.querySelectorAll('.game-block');
            const draws = [];

            gameBlocks.forEach(block => {
                const titleEl = block.querySelector('.game-title span');
                if (!titleEl) return;

                const titleText = titleEl.innerText.trim();

                // Only process "La Primera" games (Día and Noche)
                if (!titleText.includes('Primera')) return;

                // Get date
                const dateEl = block.querySelector('.session-date');
                if (!dateEl) return;

                const date = dateEl.innerText.trim();

                // Only include today's results
                if (date !== todayStr) return;

                // Get the 3 numbers
                const scoreElements = block.querySelectorAll('.score');
                const numbers = Array.from(scoreElements)
                    .map(el => el.innerText.trim())
                    .filter(num => /^\d{1,2}$/.test(num))
                    .slice(0, 3);

                if (numbers.length === 3) {
                    // Determine time based on title
                    let dominicanTime = '';
                    if (titleText.includes('Día')) {
                        dominicanTime = '12:00 PM';
                    } else if (titleText.includes('Noche')) {
                        dominicanTime = '8:00 PM';
                    }

                    if (dominicanTime) {
                        draws.push({
                            name: titleText,
                            dominicanTime: dominicanTime,
                            numbers: numbers
                        });
                    }
                }
            });

            return draws;
        }, todayStr);

        await browser.close();

        // Convert Dominican Republic times (AST, UTC-4) to Panama times (EST, UTC-5)
        // Subtract 1 hour
        const timeMap = {
            '12:00 PM': '11:00 AM',  // 12:00 PM AST -> 11:00 AM EST
            '8:00 PM': '7:00 PM'     // 8:00 PM AST -> 7:00 PM EST
        };

        const convertedResults = results.map(result => ({
            name: result.name,
            hour: timeMap[result.dominicanTime] || result.dominicanTime,
            numbers: result.numbers
        }));

        console.log('Dominican Republic scraping completed:', convertedResults);
        return convertedResults;

    } catch (error) {
        console.error('Error scraping Dominican Republic:', error);
        await browser.close();
        return [];
    }
}
