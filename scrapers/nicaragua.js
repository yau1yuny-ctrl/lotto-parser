import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';

chromium.use(StealthPlugin());

export async function scrapeSuerteNica() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Enable Ghostery adblocker
    await enableAdBlocker(page);

    try {
        await page.goto('https://suertenica.com/', { waitUntil: 'networkidle' });

        // Get today's date for verification
        const today = new Date();
        const todayDay = today.getDate();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const todayMonth = monthNames[today.getMonth()];
        const todayYear = today.getFullYear();

        const results = await page.evaluate(({ todayDay, todayMonth, todayYear }) => {
            // Check if page date matches today
            const dateElement = document.querySelector('p.suertenica-date strong');
            if (dateElement) {
                const dateText = dateElement.innerText;
                // Format: "Actualizados Domingo 11 de Enero, 2026"
                if (!dateText.includes(todayDay.toString()) ||
                    !dateText.includes(todayMonth) ||
                    !dateText.includes(todayYear.toString())) {
                    console.log('Nicaragua results are not from today, skipping');
                    return [];
                }
            }
            const allDraws = [];

            // Find Diaria section
            const diariaContainer = document.querySelector('.resultados-container');
            const diariaDraws = {};

            if (diariaContainer) {
                const diariaResults = diariaContainer.querySelectorAll('.resultado');
                diariaResults.forEach(function (result) {
                    const drawText = result.querySelector('p') ? result.querySelector('p').innerText.trim() : '';
                    const balls = Array.from(result.querySelectorAll('.bolilla'));
                    const numbers = balls.map(function (b) { return b.innerText.trim(); });

                    // Extract time from drawText (e.g., "Sorteo 12299 - 3:00 PM")
                    const timeMatch = drawText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (timeMatch && numbers.length > 0) {
                        const time = timeMatch[0];
                        diariaDraws[time] = numbers;
                    }
                });
            }

            // Find Premia2 section
            const premia2Container = document.querySelector('.premia2-resultados-container');
            const premia2Draws = {};

            if (premia2Container) {
                const premia2Results = premia2Container.querySelectorAll('.premia2-resultado');
                premia2Results.forEach(function (result) {
                    const drawText = result.querySelector('p') ? result.querySelector('p').innerText.trim() : '';
                    const balls = Array.from(result.querySelectorAll('.premia2-bolilla'));
                    const numbers = balls.map(function (b) { return b.innerText.trim(); });

                    // Extract time from drawText
                    const timeMatch = drawText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (timeMatch && numbers.length > 0) {
                        const time = timeMatch[0];
                        premia2Draws[time] = numbers;
                    }
                });
            }

            // Combine results for each time
            // Expected times in Nicaragua: 12:00 PM, 3:00 PM, 6:00 PM, 9:00 PM
            const nicaraguaTimes = ['12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

            nicaraguaTimes.forEach(function (nicaraguaTime) {
                const diariaNumbers = diariaDraws[nicaraguaTime];
                const premia2Numbers = premia2Draws[nicaraguaTime];

                if (diariaNumbers && premia2Numbers) {
                    // Filter out non-numeric values
                    const diariaDigits = diariaNumbers.filter(function (n) {
                        return !isNaN(n) && n !== '';
                    });
                    const premia2Digits = premia2Numbers.filter(function (n) {
                        return !isNaN(n) && n !== '';
                    });

                    if (diariaDigits.length >= 2 && premia2Digits.length >= 4) {
                        // Prize 1: First 2 digits from Diaria
                        const prize1 = diariaDigits[0] + diariaDigits[1];
                        // Prize 2: First 2 digits from Premia2
                        const prize2 = premia2Digits[0] + premia2Digits[1];
                        // Prize 3: Last 2 digits from Premia2
                        const prize3 = premia2Digits[2] + premia2Digits[3];

                        // Convert Nicaragua time (UTC-6) to Panama time (UTC-5) by adding 1 hour
                        const timeMatch = nicaraguaTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                        let panamaTime = '';

                        if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const minutes = timeMatch[2];
                            const period = timeMatch[3].toUpperCase();

                            // Convert to 24-hour format
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;

                            // Add 1 hour (Nicaragua UTC-6 to Panama UTC-5)
                            hours += 1;
                            if (hours >= 24) hours -= 24;

                            // Convert back to 12-hour format
                            const newPeriod = hours >= 12 ? 'PM' : 'AM';
                            const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                            panamaTime = displayHours + ':' + minutes + ' ' + newPeriod;
                        }

                        allDraws.push({
                            time: panamaTime || nicaraguaTime,
                            prizes: [prize1, prize2, prize3]
                        });
                    }
                }
            });

            return allDraws;
        }, { todayDay, todayMonth, todayYear });

        return results;
    } catch (error) {
        console.error('Error scraping SuerteNica:', error);
        return null;
    } finally {
        await browser.close();
    }
}
