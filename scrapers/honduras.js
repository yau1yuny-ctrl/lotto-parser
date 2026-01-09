import { chromium } from 'playwright';

// Version 2.0 - Forced update to fix encoding issues
export async function scrapeHonduras() {
    console.log('Starting Honduras scraper...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://loto.hn/', { waitUntil: 'networkidle' });

        await page.evaluate(() => {
            const modal = document.querySelector('.pum-close, .close-modal');
            if (modal) {
                console.log('Closing popup');
                modal.click();
            }
        });

        const results = await page.evaluate(() => {
            const games = {};
            const dateInfo = document.querySelector('.et_pb_text_1 .et_pb_text_inner')?.innerText.trim();

            const mapping = {
                'DIARIA': '.et_pb_column_1_3.et_pb_column_3',
                'PEGA3': '.et_pb_column_1_4.et_pb_column_5',
                'PREMIA2': '.et_pb_column_1_4.et_pb_column_6',
                'SUPERPREMIO': '.et_pb_column_1_4.et_pb_column_7'
            };

            for (const [game, selector] of Object.entries(mapping)) {
                const container = document.querySelector(selector);
                if (container) {
                    const numbers = Array.from(container.querySelectorAll('.esferas span'))
                        .map(s => { return s.innerText.trim(); });
                    if (numbers.length > 0) {
                        games[game] = numbers;
                    }
                }
            }

            return { date: dateInfo, games };
        });

        return results;
    } catch (error) {
        console.error('Error in Honduras scraper:', error);
        return null;
    } finally {
        await browser.close();
    }
}
