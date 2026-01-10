import { chromium } from 'playwright';

export async function scrapePanama() {
    console.log('Starting Panama scraper...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://panamaloteria.com/', { waitUntil: 'networkidle' });

        const results = await page.evaluate(function () {
            const data = [];
            const panels = document.querySelectorAll('.panel.panel-success, .panel.panel-primary');

            panels.forEach(function (panel) {
                const headerEl = panel.querySelector('.panel-heading h2');
                if (!headerEl) return;

                const fullTitle = headerEl.innerText.trim();
                const table = panel.querySelector('table');
                if (!table) return;

                const gameData = {};
                const rows = table.querySelectorAll('tr');
                rows.forEach(function (row) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const label = cells[0].innerText.trim();
                        const value = cells[1].innerText.trim();
                        if (label && value) {
                            gameData[label] = value;
                        }
                    }
                });

                if (Object.keys(gameData).length > 0) {
                    data.push({
                        title: fullTitle,
                        results: gameData
                    });
                }
            });

            return data;
        });

        return results;
    } catch (error) {
        console.error('Error in Panama scraper:', error);
        return null;
    } finally {
        await browser.close();
    }
}
