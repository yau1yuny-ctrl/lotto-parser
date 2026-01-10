import { chromium } from 'playwright';

export async function scrapeUSLotteries() {
    console.log('Starting US Lotteries scraper (Verified selectors)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to Conectate US lotteries page...');
        await page.goto('https://www.conectate.com.do/loterias/americanas', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('Waiting for content to load...');
        await page.waitForTimeout(7000);

        const results = await page.evaluate(function () {
            const data = [];
            const blocks = document.querySelectorAll('.game-block');

            blocks.forEach(block => {
                const titleEl = block.querySelector('.game-title span');
                if (!titleEl) return;

                const title = titleEl.innerText.trim();

                // We are looking for New York and Florida
                if (title.includes('New York') || title.includes('Florida')) {
                    // Try to extract numbers from span.score or .session-ball
                    const scoreEls = block.querySelectorAll('.score, .session-ball');
                    const numbers = Array.from(scoreEls).map(s => s.innerText.trim()).filter(n => n.length > 0);

                    if (numbers.length > 0) {
                        data.push({
                            title: title,
                            prizes: numbers.slice(0, 3) // 1st, 2nd, 3rd prize
                        });
                    }
                }
            });

            return data;
        });

        return results;
    } catch (error) {
        console.error('Error in US Lotteries Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
