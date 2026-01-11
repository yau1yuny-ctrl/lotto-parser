import { chromium } from 'playwright';

export async function scrapePanama() {
    console.log('Starting official Panama LNB scraper (Numbers Only version)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(180000); // 3 minutes

        console.log('Navigating to LNB official page...');

        // Try up to 3 times with increasing timeouts
        let loaded = false;
        for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
            try {
                await page.goto('https://www.lnb.gob.pa/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 * attempt // 60s, 120s, 180s
                });
                loaded = true;
            } catch (error) {
                console.log(`Attempt ${attempt} failed, retrying...`);
                if (attempt === 3) throw error;
            }
        }

        console.log('Waiting for content...');
        await page.waitForTimeout(10000); // Increased wait time

        const results = await page.evaluate(function () {
            const data = [];

            // Get today's date in Panama timezone
            const today = new Date();
            const todayDay = today.getDate();
            const todayMonth = today.toLocaleString('es-ES', { month: 'long' });
            const todayYear = today.getFullYear();

            // Each draw is in a containerTablero
            const containers = document.querySelectorAll('div.containerTablero');

            containers.forEach(container => {
                // Extract the date from this sorteo
                const dateEl = container.querySelector('.date');
                if (!dateEl) return;

                const dateText = dateEl.innerText.trim().replace(/\s+/g, ' ');
                // Format: "04 de Enero de 2026"
                const dateParts = dateText.split(' ');
                if (dateParts.length < 5) return;

                const day = parseInt(dateParts[0]);
                const month = dateParts[2]; // "Enero", "Febrero", etc.
                const year = parseInt(dateParts[4]);

                // Only process if this sorteo is from today
                if (day !== todayDay || month.toLowerCase() !== todayMonth.toLowerCase() || year !== todayYear) {
                    return; // Skip this sorteo, it's not from today
                }

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

                        // User specifically asked NOT to include letters.
                        // We only store the numbers for 1st, 2nd, and 3rd prizes.
                        prizes.push({
                            label: label,
                            number: number
                        });
                    }
                });

                if (prizes.length > 0) {
                    data.push({
                        title: drawName,
                        date: dateText, // Include the date for reference
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
