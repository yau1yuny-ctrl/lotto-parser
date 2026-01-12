import { supabase } from './utils/supabase.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - NIGHT BLOCK (with retry)');
console.log('Time: 10:20 PM - 12:30 AM Panama');
console.log('='.repeat(60));
console.log('');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeWithRetry(scrapeFn, filterFn, name, maxAttempts = 30) {
    let found = false;
    let attempts = 0;
    let result = null;

    console.log(`🔄 Starting retry loop for ${name}...`);
    console.log(`Max attempts: ${maxAttempts} (retry every 2 minutes)`);
    console.log('');

    while (!found && attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} for ${name}...`);

        try {
            const results = await scrapeFn();
            result = filterFn(results);

            if (result) {
                console.log(`✅ ${name} found!`);
                found = true;
            } else {
                if (attempts < maxAttempts) {
                    console.log(`⏳ ${name} not found yet. Waiting 2 minutes before retry...`);
                    await sleep(120000); // 2 minutes
                } else {
                    console.log(`❌ ${name} not found after ${maxAttempts} attempts. Giving up.`);
                }
            }
        } catch (e) {
            console.error(`❌ Error on attempt ${attempts}:`, e.message);
            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting 2 minutes before retry...`);
                await sleep(120000);
            }
        }
    }

    return result;
}

async function scrapeNightDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running night scraper for: ${today}`);
    console.log('');

    const allResults = [];

    // 11:30 PM - USA (New York) with retry
    console.log('🇺🇸 Scraping USA (11:30 PM)...');
    const nyResult = await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('New York 11:30')),
        'USA New York 11:30 PM',
        30 // 30 attempts = 1 hour
    );

    if (nyResult) {
        console.log(`✅ USA New York 11:30: ${nyResult.prizes.join(', ')}`);
        allResults.push({
            country: 'USA',
            draw_name: 'New York 11:30 PM',
            time: '11:30 PM',
            numbers: nyResult.prizes
        });
    }

    // Save to Supabase
    console.log('');
    console.log('='.repeat(60));
    console.log(`TOTAL: ${allResults.length} draws found`);
    console.log('='.repeat(60));

    if (allResults.length > 0) {
        console.log('Saving to Supabase...');

        for (const result of allResults) {
            try {
                const { error } = await supabase
                    .from('lottery_results')
                    .insert([{
                        country: result.country,
                        draw_name: result.draw_name,
                        draw_date: today,
                        data: [{ time: result.time, numbers: result.numbers }],
                        scraped_at: new Date().toISOString()
                    }]);

                if (error) {
                    console.error(`❌ ${result.country} ${result.time} error:`, error);
                } else {
                    console.log(`✅ ${result.country} ${result.time} saved`);
                }
            } catch (e) {
                console.error(`❌ ${result.country} error:`, e.message);
            }
        }
    } else {
        console.log('⚠️  No results found to save');
    }

    console.log('');
    console.log('Night scraper completed!');
}

scrapeNightDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
