import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeCostaRica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Apply all optimizations
    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Costa Rica scraper - loteriascostarica.com');
        await page.goto('https://www.loteriascostarica.com/', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for cards to load
        await page.waitForSelector('.card', { timeout: 30000 });

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        // Extract results for all three draws
        const results = await page.evaluate((todayStr) => {
            const findCard = (titleText) => {
                return Array.from(document.querySelectorAll('.card')).find(card =>
                    card.querySelector('.card-header')?.innerText?.toUpperCase().includes(titleText.toUpperCase())
                );
            };

            const extractPrizes = (ticaCard, monazoCard, todayStr) => {
                if (!ticaCard || !monazoCard) return null;

                const ticaDate = ticaCard.querySelector('.card-footer .text-left')?.innerText?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                const monazoDate = monazoCard.querySelector('.card-footer .text-left')?.innerText?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                const time = ticaCard.querySelector('.card-footer .text-right')?.innerText?.match(/\d{2}:\d{2}/)?.[0];

                if (ticaDate !== todayStr || monazoDate !== todayStr) return null;

                const ticaNumbers = Array.from(ticaCard.querySelectorAll('.btn-circle')).map(n => n.innerText.trim());
                const monazoNumbers = Array.from(monazoCard.querySelectorAll('.btn-circle')).map(n => n.innerText.trim());

                const prize1 = ticaNumbers[0];
                const fullNumber = monazoNumbers[0] || '';

                if (!prize1 || fullNumber.length < 3) return null;

                const prize2 = fullNumber.substring(0, 2);
                const prize3 = fullNumber.substring(fullNumber.length - 2);

                return {
                    time: time,
                    prizes: [prize1, prize2, prize3]
                };
            };

            const draws = [];

            // Draw 1: 1:55 PM (01:00) - TICA DIA REVENTADOS + MONAZO TICA DIA
            const ticaDia = findCard('TICA DIA REVENTADOS');
            const monazoDia = findCard('MONAZO TICA DIA');
            const draw1 = extractPrizes(ticaDia, monazoDia, todayStr);
            if (draw1) draws.push(draw1);

            // Draw 2: 5:30 PM (17:30) - TICA REVENTADOS 4:30 + MONAZO TICA 4:30 PM
            const tica430 = findCard('TICA REVENTADOS 4:30');
            const monazo430 = findCard('MONAZO TICA 4:30 PM');
            const draw2 = extractPrizes(tica430, monazo430, todayStr);
            if (draw2) draws.push(draw2);

            // Draw 3: 8:30 PM (20:30) - TICA NOCHE REVENTADOS + MONAZO TICA NOCHE
            const ticaNoche = findCard('TICA NOCHE REVENTADOS');
            const monazoNoche = findCard('MONAZO TICA NOCHE');
            const draw3 = extractPrizes(ticaNoche, monazoNoche, todayStr);
            if (draw3) draws.push(draw3);

            return draws;
        }, todayStr);

        await browser.close();

        // Convert Costa Rica times (UTC-6) to Panama times (UTC-5)
        const timeMap = {
            '01:00': '2:55 PM',  // Mediodía (1:55 PM CR -> 2:55 PM Panama)
            '13:00': '2:55 PM',  // Alternative format
            '16:30': '5:30 PM',  // Tarde (4:30 PM CR -> 5:30 PM Panama)
            '17:30': '6:30 PM',  // Alternative
            '20:30': '9:30 PM'   // Noche (8:30 PM CR -> 9:30 PM Panama)
        };

        const convertedResults = results.map(result => ({
            time: timeMap[result.time] || result.time,
            prizes: result.prizes
        }));

        console.log('Costa Rica scraping completed:', convertedResults);
        return convertedResults;

    } catch (error) {
        console.error('Error scraping Costa Rica:', error);
        await browser.close();
        return [];
    }
}
