import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

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
        // Get target date using Panama timezone
        const { DateTime } = await import('luxon');
        const dateToUse = targetDate
            ? DateTime.fromISO(targetDate, { zone: 'America/Panama' })
            : DateTime.now().setZone('America/Panama');
        const isSunday = dateToUse.weekday === 7;
        const isTuesdayOrFriday = dateToUse.weekday === 2 || dateToUse.weekday === 5; // Tuesday = 2, Friday = 5
        const todayStr = dateToUse.toFormat('yyyy-MM-dd');

        console.log('Looking for results from:', todayStr);
        console.log('Is Sunday:', isSunday);
        console.log('Is Tuesday or Friday (Chance):', isTuesdayOrFriday);

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

        // Scrape Chance on Tuesdays and Fridays
        let chanceResult = null;
        if (isTuesdayOrFriday) {
            console.log('Fetching Chance (Tuesday/Friday)...');
            const chancePage = await browser.newPage();
            await setRandomUserAgent(chancePage);
            // await enableAdBlocker(chancePage); // Disabled - blocks Chance results
            await setupAdvancedInterception(chancePage);

            await chancePage.goto('https://www.jps.go.cr/resultados/chances', {
                waitUntil: 'networkidle',
                timeout: 120000
            });

            await chancePage.waitForTimeout(30000);

            chanceResult = await chancePage.evaluate(() => {
                // Replace this section in scrapers/costa_rica.js (lines 216-258):
                chanceResult = await chancePage.evaluate(() => {
                    // Simple text-based extraction (WORKING VERSION)
                    const bodyText = document.body.innerText;
                    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l);

                    const prizes = { first: null, second: null, third: null };

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];

                        if (line.includes('1er') && !prizes.first) {
                            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                                if (/^\d{2}$/.test(lines[j])) {
                                    prizes.first = lines[j];
                                    console.log('Found 1er:', lines[j]);
                                    break;
                                }
                            }
                        }

                        if (line.includes('2do') && !prizes.second) {
                            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                                if (/^\d{2}$/.test(lines[j]) && lines[j] !== prizes.first) {
                                    prizes.second = lines[j];
                                    console.log('Found 2do:', lines[j]);
                                    break;
                                }
                            }
                        }

                        if (line.includes('3er') && !prizes.third) {
                            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                                if (/^\d{2}$/.test(lines[j]) && lines[j] !== prizes.first && lines[j] !== prizes.second) {
                                    prizes.third = lines[j];
                                    console.log('Found 3er:', lines[j]);
                                    break;
                                }
                            }
                        }
                    }

                    if (prizes.first && prizes.second && prizes.third) {
                        console.log('Found Chance:', prizes.first, prizes.second, prizes.third);
                        return prizes;
                    }

                    console.log('Chance numbers not found. Prizes found:', prizes);
                    return null;
                });
            });

            await chancePage.close();
            console.log('Chance:', chanceResult);
        }

        await browser.close();

        // Combine results
        if (nuevosTiempos.mediodia && monazos.mediodia) {
            allResults.push({
                time: '1:55 PM',
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

        // For 8:30 PM: use Lotería Nacional on Sundays, Chance on Tue/Fri, regular otherwise
        if (isSunday && loteriaNacional) {
            allResults.push({
                time: '8:30 PM',
                prizes: [
                    loteriaNacional.first,   // 1er lugar
                    loteriaNacional.second,  // 2do lugar
                    loteriaNacional.third    // 3er lugar
                ]
            });
        } else if (isTuesdayOrFriday && chanceResult) {
            allResults.push({
                time: '8:30 PM',
                prizes: [
                    chanceResult.first,   // 1er lugar
                    chanceResult.second,  // 2do lugar
                    chanceResult.third    // 3er lugar
                ]
            });
        } else if (!isSunday && !isTuesdayOrFriday && nuevosTiempos.noche && monazos.noche) {
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
