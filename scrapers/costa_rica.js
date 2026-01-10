import { chromium } from 'playwright';

export async function scrapeCostaRica() {
    console.log('Starting Costa Rica scraper (Robust version)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        // Set a long timeout for the entire process
        page.setDefaultTimeout(120000);

        console.log('Navigating to JPS results page...');
        // Wait for 'commit' instead of 'networkidle' to avoid timeouts on slow assets
        await page.goto('https://jps.go.cr/resultados', { waitUntil: 'commit', timeout: 90000 });

        console.log('Waiting for content to appear...');
        // Wait for any draw-related text
        await page.waitForSelector('text=Mediodía, Tarde, Noche', { timeout: 60000 }).catch(() => console.log('Timeout waiting for text'));

        // Scroll to ensure JS loads content
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(3000);

        const results = await page.evaluate(function () {
            const data = [];

            // Targeted games
            const configs = [
                { id: 'header-3Monazos', name: '3 Monazos' },
                { id: 'header-NuevosTiemposReventados', name: 'Nuevos Tiempos' }
            ];

            configs.forEach(config => {
                const header = document.getElementById(config.id);
                if (!header) return;

                const parent = header.closest('.flex.flex-col') || header.parentElement.parentElement;
                const gameName = config.name;

                // Find date
                const dateBtn = parent.querySelector('button.min-w-fit, span:contains("Viernes"), span:contains("9 de Enero")');
                const dateText = dateBtn ? dateBtn.innerText.trim() : 'Hoy';

                const draws = [];
                // Look for draw containers
                const drawContainers = parent.querySelectorAll('.flex.flex-row.justify-between');

                drawContainers.forEach(container => {
                    const timeEl = container.querySelector('p.font-bold, span.font-bold');
                    const time = timeEl ? timeEl.innerText.trim() : '';

                    if (['Mediodía', 'Tarde', 'Noche'].includes(time)) {
                        const numbers = [];
                        const numEls = container.querySelectorAll('span.font-bold, p.font-bold.text-2xl');
                        numEls.forEach(n => {
                            const val = n.innerText.trim();
                            if (val && val.match(/^\d+$/) && val !== time && val.length <= 4) {
                                numbers.push(val);
                            }
                        });

                        if (numbers.length > 0) {
                            if (!draws.find(d => d.time === time)) {
                                draws.push({ time: time, numbers: numbers });
                            }
                        }
                    }
                });

                if (draws.length > 0) {
                    data.push({
                        name: gameName,
                        date: dateText,
                        draws: draws
                    });
                }
            });

            return data;
        });

        return results;
    } catch (error) {
        console.error('Error in Costa Rica Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
