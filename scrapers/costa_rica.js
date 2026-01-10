import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

// Use the stealth plugin
chromium.use(stealth());

export async function scrapeCostaRica() {
    console.log('Starting Costa Rica scraper (Stealth Mode V3)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to JPS results page...');
        await page.goto('https://www.jps.go.cr/resultados', { waitUntil: 'networkidle', timeout: 90000 });

        console.log('Waiting for content to settle...');
        await page.waitForTimeout(15000);

        const results = await page.evaluate(function () {
            const data = [];
            const draws = ['Mediodía', 'Tarde', 'Noche'];

            // Map to store raw digits found near draw times
            const raw = { 'Mediodía': {}, 'Tarde': {}, 'Noche': {} };

            // We'll iterate through all text nodes or specific cards
            const cards = document.querySelectorAll('.card, section, [class*="Container"]');

            cards.forEach(card => {
                const text = card.innerText;
                // Determine which game this card is for
                let game = null;
                if (text.includes('Nuevos Tiempos')) game = 'NT';
                else if (text.includes('3 Monazos')) game = '3M';

                if (game) {
                    draws.forEach(draw => {
                        // Find the draw header (e.g., "Tarde")
                        const allNodes = Array.from(card.querySelectorAll('*'));
                        const drawEl = allNodes.find(el => el.children.length === 0 && el.innerText.trim() === draw);

                        if (drawEl) {
                            // The numbers are usually in the next siblings or same parent
                            let container = drawEl.parentElement;
                            let attempt = 0;
                            let numbers = [];

                            while (attempt < 3 && numbers.length === 0) {
                                numbers = Array.from(container.querySelectorAll('.numero, .ball, .esfera, span'))
                                    .map(s => s.innerText.trim())
                                    .filter(t => /^\d+$/.test(t));
                                container = container.parentElement;
                                attempt++;
                            }

                            if (numbers.length > 0) {
                                // For NT, if we see something like [89, 40], take the first
                                // For 3M, take the first 3
                                if (game === 'NT') raw[draw].NT = numbers[0];
                                else if (game === '3M' && numbers.length >= 3) raw[draw].M3 = numbers.slice(0, 3);
                            }
                        }
                    });
                }
            });

            // If we didn't find them via cards, try a global text-based search (fallback)
            if (!raw.Tarde.NT || !raw.Tarde.M3) {
                const bodyText = document.body.innerText;
                draws.forEach(draw => {
                    // This is much harder via regex but let's try finding the draw name and numbers after it
                    // Based on text dump: "Tarde\n6\n7\n7"
                    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i] === draw) {
                            // Look ahead for numbers
                            const nextNumbers = [];
                            for (let j = i + 1; j < i + 6 && j < lines.length; j++) {
                                if (/^\d+$/.test(lines[j])) nextNumbers.push(lines[j]);
                                else if (nextNumbers.length > 0) break;
                            }

                            if (nextNumbers.length >= 1) {
                                // We need a way to distinguish NT from 3M in this flat list
                                // Usually 3 Monazos comes first in the page or vice versa
                                // Let's look at the "Sorteo" number above it
                                const sorteoLine = lines[i - 1] || "";
                                // 3 Monazos sorteos are usually 4-digits (e.g. 5688), NT are 5-digits (23262)
                                if (sorteoLine.includes('Sorteo')) {
                                    const numMatch = sorteoLine.match(/\d+/);
                                    if (numMatch) {
                                        const sNum = parseInt(numMatch[0]);
                                        if (sNum < 15000 && nextNumbers.length >= 3) raw[draw].M3 = nextNumbers.slice(0, 3);
                                        else if (sNum >= 15000) raw[draw].NT = nextNumbers[0];
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Combine
            draws.forEach(draw => {
                const nt = raw[draw].NT;
                const m3 = raw[draw].M3;
                if (nt && m3 && m3.length === 3) {
                    data.push({
                        time: draw,
                        prizes: [nt, m3[0] + m3[1], m3[1] + m3[2]]
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
