import { chromium } from 'playwright';

export async function scrapePanama() {
    console.log('Starting official Panama LNB scraper (Final Version)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to LNB official page...');
        await page.goto('https://www.lnb.gob.pa/', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('Waiting for content...');
        await page.waitForTimeout(7000);

        const results = await page.evaluate(function () {
            const data = [];

            // Each draw is in a containerTablero
            const containers = document.querySelectorAll('div.containerTablero');

            containers.forEach(container => {
                // Identify the draw by the logo image
                const logoImg = container.querySelector('.sorteo-logo img');
                let drawName = 'Sorteo Desconocido';

                if (logoImg) {
                    const src = logoImg.src;
                    if (src.includes('TableroD.webp')) drawName = 'Sorteo Dominical';
                    else if (src.includes('TableroI.webp')) drawName = 'Sorteo Miercolito';
                    else if (src.includes('TableroZ.webp')) drawName = 'Gordito del Zodíaco';
                    else if (src.includes('TableroE.webp')) drawName = 'Sorteo Extraordinario';
                }

                // Prizes are in .premio blocks
                const prizes = [];
                const premioBlocks = container.querySelectorAll('.premio');

                premioBlocks.forEach((block, index) => {
                    const labelEl = block.querySelector('h2');
                    const numberEl = block.querySelector('.premio-number');

                    if (numberEl) {
                        const label = labelEl ? labelEl.innerText.trim() : `Premio ${index + 1}`;
                        const number = numberEl.innerText.trim();

                        let prizeObj = { label: label, number: number };

                        // If it's the 1st prize, try to get the letters
                        if (index === 0) {
                            const lettersEl = container.querySelector('.primer-premio-details .value');
                            if (lettersEl) {
                                prizeObj.letras = lettersEl.innerText.trim();
                            }
                        }

                        prizes.push(prizeObj);
                    }
                });

                if (prizes.length > 0) {
                    data.push({
                        title: drawName,
                        prizes: prizes
                    });
                }
            });

            return data;
        });

        return results;
    } catch (error) {
        console.error('Error in Panama LNB scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
