import { chromium } from 'playwright';

// Helper function to check if USA is currently in Daylight Saving Time
function isUSDST() {
    const now = new Date();
    const year = now.getFullYear();

    // DST starts: Second Sunday in March at 2:00 AM
    const marchFirst = new Date(year, 2, 1); // March 1
    const dstStart = new Date(marchFirst);
    const daysUntilSunday = (7 - marchFirst.getDay()) % 7;
    dstStart.setDate(1 + daysUntilSunday + 7); // Second Sunday
    dstStart.setHours(2, 0, 0, 0);

    // DST ends: First Sunday in November at 2:00 AM
    const novFirst = new Date(year, 10, 1); // November 1
    const dstEnd = new Date(novFirst);
    const daysUntilSundayNov = (7 - novFirst.getDay()) % 7;
    dstEnd.setDate(1 + daysUntilSundayNov); // First Sunday
    dstEnd.setHours(2, 0, 0, 0);

    return now >= dstStart && now < dstEnd;
}

// Helper function to convert EDT to EST (subtract 1 hour)
function convertEDTtoEST(edtTime) {
    if (!edtTime) return '';

    // Parse time like "2:30 PM" or "10:30 PM"
    const match = edtTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return edtTime; // Return original if can't parse

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Subtract 1 hour (EDT is 1 hour ahead of EST/Panama)
    hours -= 1;
    if (hours < 0) hours += 24;

    // Convert back to 12-hour format
    const newPeriod = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);

    return `${displayHours}:${minutes} ${newPeriod}`;
}

export async function scrapeUSLotteries() {
    console.log('Starting US Lotteries scraper (Verified selectors)...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(120000);

        console.log('Navigating to Conectate US lotteries page...');
        await page.goto('https://www.conectate.com.do/loterias/americanas', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('Waiting for content to load...');
        await page.waitForTimeout(7000);

        const results = await page.evaluate(function () {
            const data = [];
            const blocks = document.querySelectorAll('.game-block');

            blocks.forEach(block => {
                const titleEl = block.querySelector('.game-title span');
                if (!titleEl) return;

                const title = titleEl.innerText.trim();

                // We are looking for New York and Florida
                if (title.includes('New York') || title.includes('Florida')) {
                    // Try to extract numbers from span.score or .session-ball
                    const scoreEls = block.querySelectorAll('.score, .session-ball');
                    const numbers = Array.from(scoreEls).map(s => s.innerText.trim()).filter(n => n.length > 0);

                    if (numbers.length > 0) {
                        data.push({
                            title: title,
                            prizes: numbers.slice(0, 3) // 1st, 2nd, 3rd prize
                        });
                    }
                }
            });

            return data;
        });

        // If we're in DST, convert times from EDT to EST (Panama time)
        // Note: The website might not show specific times, but if it does in the future,
        // we would need to convert them here
        const inDST = isUSDST();
        if (inDST) {
            console.log('USA is in Daylight Saving Time (EDT). Times would need conversion to Panama time (EST).');
            // If the scraper starts returning time information, convert it here
            // results.forEach(result => {
            //     if (result.time) {
            //         result.time = convertEDTtoEST(result.time);
            //     }
            // });
        }

        return results;
    } catch (error) {
        console.error('Error in US Lotteries Scraper:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
