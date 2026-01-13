import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeSuerteNica(targetDate = null) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Apply all optimizations
    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Nicaragua scraper - loteriasdenicaragua.com');
        await page.goto('https://loteriasdenicaragua.com/', { waitUntil: 'networkidle' });

        // Get target date for verification (use provided date or today)
        const { DateTime } = await import('luxon');
        const dateToUse = targetDate
            ? DateTime.fromISO(targetDate, { zone: 'America/Panama' })
            : DateTime.now().setZone('America/Panama');

        const results = await page.evaluate(({ targetDate }) => {
            const allDraws = [];

            // Find all game blocks
            const blocks = document.querySelectorAll('.game-block');

            // Nicaragua times we're looking for (in Nicaragua time UTC-6)
            const nicaraguaTimes = ['12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

            nicaraguaTimes.forEach(nicaraguaTime => {
                let diariaNumber = null;
                let premia2Numbers = [];

                // Find Diaria block for this time
                blocks.forEach(block => {
                    const title = block.querySelector('.game-title span');
                    if (!title) return;

                    const titleText = title.innerText.trim();

                    // Diaria - get the 2-digit number (primer premio)
                    if (titleText.includes('Diaria') && titleText.includes(nicaraguaTime)) {
                        const scores = Array.from(block.querySelectorAll('.game-scores .score'));
                        // The main number is usually the one without special classes
                        for (let i = 0; i < scores.length; i++) {
                            const score = scores[i];
                            const text = score.innerText.trim();
                            // Look for 2-digit number
                            if (/^\d{2}$/.test(text)) {
                                diariaNumber = text;
                                break;
                            }
                        }
                    }

                    // Premia 2 - get the two numbers (segundo y tercer premio)
                    if (titleText.includes('Premia 2') && titleText.includes(nicaraguaTime)) {
                        const scores = Array.from(block.querySelectorAll('.game-scores .score'));
                        scores.forEach(score => {
                            const text = score.innerText.trim();
                            // Look for 2-digit numbers
                            if (/^\d{2}$/.test(text)) {
                                premia2Numbers.push(text);
                            }
                        });
                    }
                });

                // If we have all 3 numbers, add to results
                if (diariaNumber && premia2Numbers.length >= 2) {
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
                        prizes: [diariaNumber, premia2Numbers[0], premia2Numbers[1]]
                    });
                }
            });

            return allDraws;
        }, { targetDate: dateToUse.toISOString().split('T')[0] });

        console.log('Nicaragua scraping completed:', results);
        return results;
    } catch (error) {
        console.error('Error scraping Nicaragua:', error);
        return null;
    } finally {
        await browser.close();
    }
}
