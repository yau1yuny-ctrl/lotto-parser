import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';

// Add stealth plugin
chromium.use(StealthPlugin());

export async function scrapePanama() {
    console.log('Starting Panama LNB scraper (FINAL WORKING VERSION)...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await setRandomUserAgent(page);
        await enableAdBlocker(page);

        await page.goto('https://www.lnb.gob.pa/', {
            waitUntil: 'networkidle',
            timeout: 90000
        });

        await page.waitForTimeout(10000);

        const results = await page.evaluate(() => {
            const data = [];
            const today = new Date();
            const todayDay = today.getDate();
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const todayMonth = monthNames[today.getMonth()];
            const todayYear = today.getFullYear();

            const containers = document.querySelectorAll('div.containerTablero');

            containers.forEach((container) => {
                const dateEl = container.querySelector('.date');
                if (!dateEl) return;

                const dateText = dateEl.innerText.trim();
                const dateParts = dateText.split('\n').filter(p => p.trim() !== '');

                if (dateParts.length < 5) return;

                const day = parseInt(dateParts[0]);
                const month = dateParts[2].toLowerCase();
                const year = parseInt(dateParts[4]);

                if (day !== todayDay || month !== todayMonth || year !== todayYear) {
                    return;
                }

                const prizes = [];
                const premioBlocks = container.querySelectorAll('.premio');

                premioBlocks.forEach((block) => {
                    const numberEl = block.querySelector('.premio-number');
                    if (numberEl) {
                        prizes.push(numberEl.innerText.trim());
                    }
                });

                if (prizes.length > 0) {
                    data.push({
                        time: '3:30 PM',
                        prizes: prizes.slice(0, 3)
                    });
                }
            });

            return data;
        });

        await browser.close();
        return results;

    } catch (error) {
        console.error('Error in Panama scraper:', error.message);
        await browser.close();
        return [];
    }
}
