import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';

// Add stealth plugin
chromium.use(StealthPlugin());

export async function scrapePanama(targetDate = null) {
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

        // Get target date for verification
        const dateToUse = targetDate ? new Date(targetDate + 'T12:00:00') : new Date();
        const targetDay = dateToUse.getDate();
        const targetMonth = dateToUse.getMonth();
        const targetYear = dateToUse.getFullYear();

        const results = await page.evaluate(({ day, month, year }) => {
            const data = [];
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const todayDay = day;
            const todayMonth = monthNames[month];
            const todayYear = year;

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
        }, { day: targetDay, month: targetMonth, year: targetYear });

        await browser.close();
        return results;

    } catch (error) {
        console.error('Error in Panama scraper:', error.message);
        await browser.close();
        return [];
    }
}
