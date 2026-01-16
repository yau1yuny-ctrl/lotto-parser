import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeLoteriaDeNicaragua(targetDate = null) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Nicaragua scraper - loteriasdenicaragua.com');
        await page.goto('https://loteriasdenicaragua.com/', { waitUntil: 'networkidle' });

        // Get target date using Panama timezone
        const { DateTime } = await import('luxon');
        const dateToUse = targetDate
            ? DateTime.fromISO(targetDate, { zone: 'America/Panama' })
            : DateTime.now().setZone('America/Panama');


        // Pass expected day for validation
        const expectedDay = dateToUse.day;
        const results = await page.evaluate((expectedDay) => {
            const allDraws = [];

            // Find all game blocks
            const blocks = document.querySelectorAll('.game-block');


            // Nicaragua times we're looking for (in Nicaragua time UTC-6)
            const nicaraguaTimes = ['12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];

            nicaraguaTimes.forEach(nicaraguaTime => {
                let diariaNumber = null;
                let premia2Numbers = [];
                let diariaDateValid = false;
                let premia2DateValid = false;

                // Find Diaria block for this time
                blocks.forEach(block => {
                    const title = block.querySelector('.game-title span');
                    if (!title) return;

                    const titleText = title.innerText.trim();

                    // Check the date label for this block
                    const dateLabel = block.querySelector('.game-date');
                    const dateLabelText = dateLabel?.innerText.trim() || '';
                    const dateMatch = dateLabelText.match(/(\d{1,2})-(\d{2})/);
                    const blockDay = dateMatch ? parseInt(dateMatch[1]) : null;

                    // Diaria - get the 2-digit number (primer premio)
                    if (titleText.includes('Diaria') && titleText.includes(nicaraguaTime)) {
                        // Only accept if date matches expected day
                        if (blockDay === expectedDay) {
                            diariaDateValid = true;
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
                    }

                    // Premia 2 - get the two numbers (segundo y tercer premio)
                    if (titleText.includes('Premia 2') && titleText.includes(nicaraguaTime)) {
                        // Only accept if date matches expected day
                        if (blockDay === expectedDay) {
                            premia2DateValid = true;
                            const scores = Array.from(block.querySelectorAll('.game-scores .score'));
                            scores.forEach(score => {
                                const text = score.innerText.trim();
                                // Look for 2-digit numbers
                                if (/^\d{2}$/.test(text)) {
                                    premia2Numbers.push(text);
                                }
                            });
                        }
                    }
                });


                // Only add results if we have all 3 numbers AND both dates are valid
                if (diariaNumber && premia2Numbers.length >= 2 && diariaDateValid && premia2DateValid) {
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
        }, expectedDay);

        console.log('LoteriasDeNicaragua scraping completed:', results);
        await browser.close();
        return results;

    } catch (error) {
        console.error('Error scraping LoteriasDeNicaragua:', error);
        await browser.close();
        return [];
    }
}
