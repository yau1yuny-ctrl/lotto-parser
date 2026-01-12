import { chromium } from 'rebrowser-playwright';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

export async function scrapeCostaRica(targetDate = null) {
    console.log('Starting Costa Rica JPS scraper (FINAL - with Lotería Nacional fix)...');
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const page = await browser.newPage();

    try {
        // Apply optimizations
        await setRandomUserAgent(page);
        await enableAdBlocker(page);
        await setupAdvancedInterception(page);

        // Get target date and check if Sunday
        const dateToUse = targetDate ? new Date(targetDate) : new Date();
        const isSunday = dateToUse.getDay() === 0;
        const todayStr = dateToUse.getFullYear() + '-' +
            String(dateToUse.getMonth() + 1).padStart(2, '0') + '-' +
            String(dateToUse.getDate()).padStart(2, '0');

        console.log('Looking for results from:', todayStr);
        console.log('Is Sunday:', isSunday);

        const allResults = [];

        // Scrape Nuevos Tiempos Reventados
        console.log('Fetching Nuevos Tiempos Reventados...');
        await page.goto('https://www.jps.go.cr/resultados/nuevos-tiempos-reventados', {
            waitUntil: 'networkidle',
            timeout: 90000
        });

        await page.waitForTimeout(8000);

        const nuevosTiempos = await page.evaluate((todayStr) => {
            const results = { mediodia: null, tarde: null, noche: null };
            const html = document.documentElement.innerHTML;

            // Search for specific timestamps
            // Mediodía: 2026-01-11T12:55:00
            const mediodiaPattern = '\\"fecha\\":\\"' + todayStr + 'T12:55:00\\"';
            const mediodiaIndex = html.indexOf(mediodiaPattern);
            if (mediodiaIndex !== -1) {
                const chunk = html.substring(Math.max(0, mediodiaIndex - 200), mediodiaIndex);
                const match = chunk.match(/\\"numero\\":(\d{1,2})/);
                if (match) results.mediodia = match[1].padStart(2, '0');
            }

            // Tarde: 2026-01-11T16:30:00
            const tardePattern = '\\"fecha\\":\\"' + todayStr + 'T16:30:00\\"';
            const tardeIndex = html.indexOf(tardePattern);
            if (tardeIndex !== -1) {
                const chunk = html.substring(Math.max(0, tardeIndex - 200), tardeIndex);
                const match = chunk.match(/\\"numero\\":(\d{1,2})/);
                if (match) results.tarde = match[1].padStart(2, '0');
            }

            // Noche: 2026-01-11T19:30:00
            const nochePattern = '\\"fecha\\":\\"' + todayStr + 'T19:30:00\\"';
            const nocheIndex = html.indexOf(nochePattern);
            if (nocheIndex !== -1) {
                const chunk = html.substring(Math.max(0, nocheIndex - 200), nocheIndex);
                const match = chunk.match(/\\"numero\\":(\d{1,2})/);
                if (match) results.noche = match[1].padStart(2, '0');
            }

            return results;
        }, todayStr);

        console.log('Nuevos Tiempos:', nuevosTiempos);

        // Scrape 3 Monazos
        console.log('Fetching 3 Monazos...');
        await page.goto('https://www.jps.go.cr/resultados/3-monazos', {
            waitUntil: 'networkidle',
            timeout: 120000  // Increased to 120 seconds
        });

        await page.waitForTimeout(10000);  // Increased wait time

        const monazos = await page.evaluate((todayStr) => {
            const results = { mediodia: null, tarde: null, noche: null };
            const html = document.documentElement.innerHTML;

            // Search for specific timestamps
            // Mediodía: 2026-01-11T12:55:00
            const mediodiaPattern = '\\"fecha\\":\\"' + todayStr + 'T12:55:00\\"';
            const mediodiaIndex = html.indexOf(mediodiaPattern);
            if (mediodiaIndex !== -1) {
                const chunk = html.substring(Math.max(0, mediodiaIndex - 500), mediodiaIndex);
                const matches = chunk.match(/\[\\\"(\d)\\\",\\\"(\d)\\\",\\\"(\d)\\\"\]/g);
                if (matches && matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    const digits = lastMatch.match(/\d/g);
                    if (digits) {
                        const num = digits.join('');
                        results.mediodia = { first2: num.substring(0, 2), last2: num.substring(1, 3) };
                    }
                }
            }

            // Tarde: 2026-01-11T16:30:00
            const tardePattern = '\\"fecha\\":\\"' + todayStr + 'T16:30:00\\"';
            const tardeIndex = html.indexOf(tardePattern);
            if (tardeIndex !== -1) {
                const chunk = html.substring(Math.max(0, tardeIndex - 500), tardeIndex);
                const matches = chunk.match(/\[\\\"(\d)\\\",\\\"(\d)\\\",\\\"(\d)\\\"\]/g);
                if (matches && matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    const digits = lastMatch.match(/\d/g);
                    if (digits) {
                        const num = digits.join('');
                        results.tarde = { first2: num.substring(0, 2), last2: num.substring(1, 3) };
                    }
                }
            }

            // Noche: 2026-01-11T19:30:00
            const nochePattern = '\\"fecha\\":\\"' + todayStr + 'T19:30:00\\"';
            const nocheIndex = html.indexOf(nochePattern);
            if (nocheIndex !== -1) {
                const chunk = html.substring(Math.max(0, nocheIndex - 500), nocheIndex);
                const matches = chunk.match(/\[\\\"(\d)\\\",\\\"(\d)\\\",\\\"(\d)\\\"\]/g);
                if (matches && matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    const digits = lastMatch.match(/\d/g);
                    if (digits) {
                        const num = digits.join('');
                        results.noche = { first2: num.substring(0, 2), last2: num.substring(1, 3) };
                    }
                }
            }

            return results;
        }, todayStr);

        console.log('Monazos:', monazos);

        // If Sunday, scrape Lotería Nacional for 8:30 PM draw
        let loteriaNacional = null;
        if (isSunday) {
            console.log('Sunday detected - fetching Lotería Nacional for 8:30 PM draw...');

            // Create NEW page WITHOUT adblocker (adblocker breaks Lotería Nacional)
            const lotPage = await browser.newPage();
            await setRandomUserAgent(lotPage);
            // NO ADBLOCKER for this page!

            await lotPage.goto('https://www.jps.go.cr/resultados/loteria-nacional', {
                waitUntil: 'networkidle',
                timeout: 120000
            });

            await lotPage.waitForTimeout(15000);  // Wait longer for full render

            loteriaNacional = await lotPage.evaluate(() => {
                // Extract from visible text
                const bodyText = document.body.innerText;

                // Extract numbers after "1er", "2do", "3er"
                const primerMatch = bodyText.match(/1er[\s\S]{0,50}?(\d{2})/);
                const segundoMatch = bodyText.match(/2do[\s\S]{0,50}?(\d{2})/);
                const tercerMatch = bodyText.match(/3er[\s\S]{0,50}?(\d{2})/);

                if (primerMatch && segundoMatch && tercerMatch) {
                    console.log('Found Lotería Nacional:', primerMatch[1], segundoMatch[1], tercerMatch[1]);
                    return {
                        first: primerMatch[1],
                        second: segundoMatch[1],
                        third: tercerMatch[1]
                    };
                }

                return null;
            });

            await lotPage.close();

            console.log('Lotería Nacional:', loteriaNacional);
        }

        await browser.close();

        // Combine results
        if (nuevosTiempos.mediodia && monazos.mediodia) {
            allResults.push({
                time: '2:55 PM',
                prizes: [
                    nuevosTiempos.mediodia,
                    monazos.mediodia.first2,
                    monazos.mediodia.last2
                ]
            });
        }

        if (nuevosTiempos.tarde && monazos.tarde) {
            allResults.push({
                time: '5:30 PM',
                prizes: [
                    nuevosTiempos.tarde,
                    monazos.tarde.first2,
                    monazos.tarde.last2
                ]
            });
        }

        // For 8:30 PM: use Lotería Nacional on Sundays
        if (isSunday && loteriaNacional) {
            allResults.push({
                time: '8:30 PM',
                prizes: [
                    loteriaNacional.first,   // 1er lugar
                    loteriaNacional.second,  // 2do lugar
                    loteriaNacional.third    // 3er lugar
                ]
            });
        } else if (!isSunday && nuevosTiempos.noche && monazos.noche) {
            allResults.push({
                time: '8:30 PM',
                prizes: [
                    nuevosTiempos.noche,
                    monazos.noche.first2,
                    monazos.noche.last2
                ]
            });
        }

        console.log('Costa Rica scraping completed:', allResults);
        return allResults;

    } catch (error) {
        console.error('Error scraping Costa Rica JPS:', error);
        await browser.close();
        return [];
    }
}
