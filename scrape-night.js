import { supabase } from './utils/supabase.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - NIGHT BLOCK');
console.log('Time: 10:20 PM - 12:30 AM Panama');
console.log('='.repeat(60));
console.log('');

async function scrapeNightDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running night scraper for: ${today}`);
    console.log('');

    const allResults = [];

    // 11:30 PM - USA (New York)
    console.log('🇺🇸 Scraping USA (11:30 PM)...');
    try {
        const usaResults = await scrapeUSLotteries();
        const nyResult = usaResults?.find(r => r.title.includes('New York 11:30'));
        if (nyResult) {
            console.log(`✅ USA New York 11:30: ${nyResult.prizes.join(', ')}`);
            allResults.push({
                country: 'USA',
                draw_name: 'New York 11:30 PM',
                time: '11:30 PM',
                numbers: nyResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ USA error:', e.message);
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
    }

    console.log('');
    console.log('Night scraper completed!');
}

scrapeNightDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
