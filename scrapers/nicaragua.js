import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { enableAdBlocker } from '../utils/resource-blocker.js';
import { setRandomUserAgent } from '../utils/user-agent.js';
import { setupAdvancedInterception } from '../utils/request-interceptor.js';

chromium.use(StealthPlugin());

export async function scrapeNuevaya(targetDate = null) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await setRandomUserAgent(page);
    await enableAdBlocker(page);
    await setupAdvancedInterception(page);

    try {
        console.log('Starting Nicaragua scraper - nuevaya.com.ni');
        await page.goto('https://nuevaya.com.ni/loto-diaria-de-nicaragua/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        // Get target date using Panama timezone
        const { DateTime } = await import('luxon');
        const dateToUse = targetDate
            ? DateTime.fromISO(targetDate, { zone: 'America/Panama' })
            : DateTime.now().setZone('America/Panama');

        // Validate date from page title
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        // Extract date from title: "HOY lunes, 12 de enero 2026"
        const dateMatch = pageTitle.match(/(\d{1,2}) de (\w+) (\d{4})/);

        if (dateMatch) {
            const pageDayStr = dateMatch[1];
            const pageDay = parseInt(pageDayStr);
            const systemDay = dateToUse.day;

            console.log(`Page date: ${pageDay}, System date: ${systemDay}`);

            if (pageDay !== systemDay) {
                console.log(`⚠️ Date mismatch! Page shows day ${pageDay} but today is ${systemDay}. Skipping.`);
                await browser.close();
                return [];
            }

            console.log('✅ Date validation passed');
        } else {
            console.log('⚠️ Could not extract date from title, proceeding with caution');
        }

        // Scrape the results
        const results = await page.evaluate(() => {
            const allDraws = [];

            // Find all tables
            const tables = document.querySelectorAll('figure.wp-block-table table.has-fixed-layout');

            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr');

                if (rows.length < 3) return;

                // Row 1: Time (e.g., "12:00 m", "3:00 pm")
                const timeCell = rows[0].querySelector('td');
                if (!timeCell) return;

                const timeText = timeCell.innerText.trim();

                // Convert Nicaragua time (UTC-6) to Panama time (UTC-5) by adding 1 hour
                let standardTime = '';
                if (timeText.includes('12:00 m')) {
                    standardTime = '1:00 PM';  // 12:00 PM Nicaragua → 1:00 PM Panama
                } else if (timeText.includes('3:00 pm')) {
                    standardTime = '4:00 PM';  // 3:00 PM Nicaragua → 4:00 PM Panama
                } else if (timeText.includes('6:00 pm')) {
                    standardTime = '7:00 PM';  // 6:00 PM Nicaragua → 7:00 PM Panama
                } else if (timeText.includes('9:00 pm')) {
                    standardTime = '10:00 PM'; // 9:00 PM Nicaragua → 10:00 PM Panama
                }

                if (!standardTime) return;

                // Row 3: Numbers
                const numbersRow = rows[2];
                const cells = numbersRow.querySelectorAll('td');

                if (cells.length >= 4) {
                    // Extract numbers from each column
                    const diariaText = cells[0].innerText.trim();
                    const fechasText = cells[1].innerText.trim();
                    const juga3Text = cells[2].innerText.trim();
                    const premia2Text = cells[3].innerText.trim();

                    // Extract just the numbers (remove multipliers like "5X", "JG", etc.)
                    const diariaMatch = diariaText.match(/\d+/);
                    const diaria = diariaMatch ? diariaMatch[0] : '';

                    // Premia2 has format "37 – 82"
                    const premia2Numbers = premia2Text.match(/\d+/g);
                    const premia2_1 = premia2Numbers && premia2Numbers[0] ? premia2Numbers[0] : '';
                    const premia2_2 = premia2Numbers && premia2Numbers[1] ? premia2Numbers[1] : '';

                    // Build prizes array: [Diaria, Premia2-1, Premia2-2]
                    const prizes = [diaria, premia2_1, premia2_2].filter(n => n !== '');

                    if (prizes.length === 3) {
                        allDraws.push({
                            time: standardTime,
                            prizes: prizes
                        });
                    }
                }
            });

            return allDraws;
        });

        console.log('Nuevaya scraping completed:', results);
        await browser.close();
        return results;

    } catch (error) {
        console.error('Error scraping Nuevaya:', error);
        await browser.close();
        return [];
    }
}
