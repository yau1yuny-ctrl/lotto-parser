import { chromium } from 'playwright';

export async function scrapeHonduras() {
    console.log('Starting Honduras scraper - Simplified (Latest only)...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://loto.hn/', { waitUntil: 'networkidle' });

        // Close common modals
        await page.evaluate(function () {
            const modal = document.querySelector('.pum-close, .close-modal, .et_social_close');
            if (modal) {
                modal.click();
            }
        });

        const results = await page.evaluate(function () {
            const games = {};
            const dateElem = document.querySelector('.et_pb_text_1 .et_pb_text_inner');
            const dateInfo = dateElem ? dateElem.innerText.trim() : '';

            // Selectors for DIARIA and PREMIA2 on homepage
            const mapping = {
                'DIARIA': '.et_pb_column_1_3.et_pb_column_3',
                'PREMIA2': '.et_pb_column_1_4.et_pb_column_6'
            };

            for (const game in mapping) {
                const selector = mapping[game];
                const container = document.querySelector(selector);
                if (container) {
                    const spheres = container.querySelectorAll('.esferas span');
                    const numbers = [];
                    for (let i = 0; i < spheres.length; i++) {
                        numbers.push(spheres[i].innerText.trim());
                    }
                    if (numbers.length > 0) {
                        games[game] = numbers;
                    }
                }
            }

            return { date: dateInfo, games: games };
        });

        return results;
    } catch (error) {
        console.error('Error in Honduras scraper:', error);
        return null;
    } finally {
        await browser.close();
    }
}
