import { chromium } from 'playwright';

export async function scrapeCostaRica() {
    console.log('Starting Costa Rica scraper (Robust Composite version)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to JPS results page...');
        await page.goto('https://jps.go.cr/resultados', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('Waiting for content to settle...');
        await page.waitForTimeout(10000); // Wait 10s for the page to actually render

        // Scroll several times to trigger lazy loading
        await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
                window.scrollBy(0, 1000);
                await new Promise(r => setTimeout(r, 1000));
            }
        });

        const results = await page.evaluate(function () {
            const rawData = {};

            // Function to find a game container by header text
            function findGameContainer(text) {
                const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, p'));
                const header = headers.find(h => h.innerText.trim().includes(text));
                if (!header) return null;
                return header.closest('.flex.flex-col') || header.parentElement.parentElement;
            }

            const games = [
                { search: 'Monazos', key: 'monazo' },
                { search: 'Nuevos Tiempos', key: 'tiempos' }
            ];

            games.forEach(game => {
                const container = findGameContainer(game.search);
                if (!container) return;

                const drawContainers = container.querySelectorAll('.flex.flex-row.justify-between');
                drawContainers.forEach(draw => {
                    const timeEl = draw.querySelector('p.font-bold, span.font-bold');
                    if (!timeEl) return;

                    const time = timeEl.innerText.trim();
                    if (['Mediodía', 'Tarde', 'Noche'].includes(time)) {
                        const numbers = [];
                        const numEls = draw.querySelectorAll('span.font-bold, p.font-bold.text-2xl');
                        numEls.forEach(n => {
                            const val = n.innerText.trim();
                            if (val && val.match(/^\d+$/) && val !== time && val.length <= 4) {
                                numbers.push(val);
                            }
                        });

                        if (numbers.length > 0) {
                            if (!rawData[time]) rawData[time] = {};
                            rawData[time][game.key] = numbers;
                        }
                    }
                });
            });

            // Calculate Monazo Composite
            const finalResults = [];
            ['Mediodía', 'Tarde', 'Noche'].forEach(time => {
                const d = rawData[time];
                if (d && d.tiempos && d.monazo && d.tiempos.length > 0 && d.monazo.length >= 3) {
                    const nt = d.tiempos[0];
                    const m = d.monazo;
                    finalResults.push({
                        time: time,
                        prizes: [
                            nt,               // 1er: Nuevos Tiempos
                            m[0] + m[1],      // 2do: Monazo 1+2
                            m[1] + m[2]       // 3er: Monazo 2+3
                        ]
                    });
                }
            });

            return finalResults;
        });

        return results;
    } catch (error) {
        console.error('Error in Costa Rica Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
