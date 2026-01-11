import { chromium } from 'playwright';

export async function scrapeHonduras() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Starting Honduras scraper - loteriasdehonduras.com');
        await page.goto('https://loteriasdehonduras.com/', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for results to load
        await page.waitForSelector('.game-block', { timeout: 30000 });

        // Extract Pega 3 results for all three daily draws
        const results = await page.evaluate(() => {
            const gameBlocks = document.querySelectorAll('.game-block');
            const allResults = [];

            gameBlocks.forEach(block => {
                const titleEl = block.querySelector('.game-title span');
                if (!titleEl) return;

                const titleText = titleEl.innerText.trim();

                // Only process Pega 3 games
                if (!titleText.includes('Pega 3')) return;

                // Extract time from title (e.g., "Pega 3 11:00 AM")
                const timeMatch = titleText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
                if (!timeMatch) return;

                const hondurasTime = timeMatch[1].trim();

                // Extract the 3 numbers from .game-scores .score
                const scoreElements = block.querySelectorAll('.game-scores .score');
                const numbers = Array.from(scoreElements)
                    .map(el => el.innerText.trim())
                    .filter(num => /^\d{1,2}$/.test(num))
                    .slice(0, 3);

                if (numbers.length === 3) {
                    allResults.push({
                        hondurasTime,
                        numbers
                    });
                }
            });

            return allResults;
        });

        await browser.close();

        // Convert Honduras times (CST, UTC-6) to Panama times (EST, UTC-5)
        const timeMap = {
            '11:00 AM': '12:00 PM',
            '3:00 PM': '4:00 PM',
            '9:00 PM': '10:00 PM'
        };

        const convertedResults = results.map(result => ({
            time: timeMap[result.hondurasTime] || result.hondurasTime,
            prizes: result.numbers
        }));

        console.log('Honduras scraping completed:', convertedResults);
        return convertedResults;

    } catch (error) {
        console.error('Error scraping Honduras:', error);
        await browser.close();
        return [];
    }
}
