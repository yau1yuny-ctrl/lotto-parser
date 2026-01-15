import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';

// Add stealth plugin
chromium.use(StealthPlugin());

export async function scrapePanama(targetDate = null) {
    console.log('Starting Panama LNB scraper (FINAL WORKING VERSION)...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    try {
        await setRandomUserAgent(page);
        await enableAdBlocker(page);

        // Capture console logs from the browser
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'log') {
                console.log(`[Browser]: ${text}`);
            }
        });

        console.log('Navigating to lnb.gob.pa...');

        // Try with domcontentloaded first (faster)
        await page.goto('https://www.lnb.gob.pa/', {
            waitUntil: 'domcontentloaded',
            timeout: 120000
        });

        console.log('Page loaded, waiting for content...');
        await page.waitForTimeout(15000);

        // Get target date for verification
        // Get target date using Panama timezone
        const { DateTime } = await import('luxon');
        const dateToUse = targetDate
            ? DateTime.fromISO(targetDate, { zone: 'America/Panama' })
            : DateTime.now().setZone('America/Panama');
        const targetDay = dateToUse.day;
        const targetMonth = dateToUse.month;
        const targetYear = dateToUse.year;

        console.log(`Looking for results from: ${targetDay}/${targetMonth}/${targetYear}`);
        console.log('Starting page evaluation...');

        const results = await page.evaluate(({ day, month, year }) => {
            const data = [];
            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const todayDay = day;
            const todayMonth = monthNames[month - 1];  // month is 1-indexed, array is 0-indexed
            const todayYear = year;

            console.log(`Looking for date: ${todayDay} de ${todayMonth} de ${todayYear}`);

            const containers = document.querySelectorAll('div.containerTablero');
            console.log(`Found ${containers.length} containers`);

            containers.forEach((container, index) => {
                const dateEl = container.querySelector('.date');
                if (!dateEl) {
                    console.log(`Container ${index}: No .date element found`);
                    return;
                }

                const dateText = dateEl.innerText.trim();
                const dateParts = dateText.split('\n').filter(p => p.trim() !== '');
                console.log(`Container ${index}: Date parts:`, dateParts);

                if (dateParts.length < 5) {
                    console.log(`Container ${index}: Not enough date parts (${dateParts.length})`);
                    return;
                }

                const day = parseInt(dateParts[0]);
                const month = dateParts[2].toLowerCase();
                const year = parseInt(dateParts[4]);

                console.log(`Container ${index}: Parsed date: ${day} de ${month} de ${year}`);

                if (day !== todayDay || month !== todayMonth || year !== todayYear) {
                    console.log(`Container ${index}: Date mismatch - skipping`);
                    return;
                }

                console.log(`Container ${index}: Date matches! Extracting prizes...`);

                const prizes = [];
                const premioBlocks = container.querySelectorAll('.premio');
                console.log(`Container ${index}: Found ${premioBlocks.length} premio blocks`);

                premioBlocks.forEach((block) => {
                    const numberEl = block.querySelector('.premio-number');
                    if (numberEl) {
                        const prize = numberEl.innerText.trim();
                        console.log(`Container ${index}: Found prize: ${prize}`);
                        prizes.push(prize);
                    }
                });

                if (prizes.length > 0) {
                    console.log(`Container ${index}: Adding ${prizes.length} prizes to results`);
                    data.push({
                        time: '3:30 PM',
                        prizes: prizes.slice(0, 3)
                    });
                }
            });

            console.log(`Total results found: ${data.length}`);
            return data;
        }, { day: targetDay, month: targetMonth, year: targetYear });

        console.log('Panama scraping completed:', results);

        await browser.close();

        if (!results || results.length === 0) {
            console.log('⚠️ No results found - returning empty array');
        }

        return results;

    } catch (error) {
        console.error('❌ Error in Panama scraper:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        try {
            await browser.close();
        } catch (closeError) {
            console.error('Error closing browser:', closeError.message);
        }
        return [];
    }
}
