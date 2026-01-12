import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - AFTERNOON BLOCK (with retry)');
console.log('Time: 4:50 PM - 10:50 PM Panama');
console.log('='.repeat(60));
console.log('');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeWithRetry(scrapeFn, filterFn, name, maxAttempts = 15) {
    let found = false;
    let attempts = 0;
    let result = null;

    console.log(`🔄 ${name} - starting retry loop (max ${maxAttempts} attempts)...`);

    while (!found && attempts < maxAttempts) {
        attempts++;
        console.log(`  Attempt ${attempts}/${maxAttempts}...`);

        try {
            const results = await scrapeFn();
            result = filterFn(results);

            if (result) {
                console.log(`  ✅ Found!`);
                found = true;
            } else {
                if (attempts < maxAttempts) {
                    console.log(`  ⏳ Not found. Waiting 2 minutes...`);
                    await sleep(120000);
                } else {
                    console.log(`  ❌ Not found after ${maxAttempts} attempts.`);
                }
            }
        } catch (e) {
            console.error(`  ❌ Error:`, e.message);
            if (attempts < maxAttempts) {
                await sleep(120000);
            }
        }
    }

    return result;
}

async function scrapeAfternoonDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running afternoon scraper for: ${today}`);
    console.log('');

    const allResults = [];

    // 5:30 PM - Costa Rica (Tarde)
    console.log('🇨🇷 Costa Rica (5:30 PM)');
    const cr530 = await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '5:30 PM'),
        'CR Tarde',
        15
    );
    if (cr530) {
        allResults.push({
            country: 'Costa Rica',
            draw_name: 'Monazo Tarde',
            time: cr530.time,
            numbers: cr530.prizes
        });
    }

    // 7:00 PM - Dominican Republic + Nicaragua (PARALLEL)
    console.log('⏰ 7:00 PM - Dominican Republic + Nicaragua (parallel)');
    const [domNoche, ni7] = await Promise.all([
        scrapeWithRetry(
            () => scrapeDominicanRepublic(),
            (results) => results?.find(r => r.name.includes('Noche')),
            'DR Noche',
            15
        ),
        scrapeWithRetry(
            () => scrapeSuerteNica(),
            (results) => results?.find(r => r.time === '7:00 PM'),
            'Nicaragua 7PM',
            15
        )
    ]);

    if (domNoche) {
        allResults.push({
            country: 'Dominican Republic',
            draw_name: 'La Primera Noche',
            time: domNoche.hour,
            numbers: domNoche.numbers
        });
    }

    if (ni7) {
        allResults.push({
            country: 'Nicaragua',
            draw_name: 'Nica 7:00 PM',
            time: ni7.time,
            numbers: ni7.prizes
        });
    }

    // 8:30 PM - Costa Rica (Noche)
    console.log('🇨🇷 Costa Rica (8:30 PM)');
    const cr830 = await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '8:30 PM'),
        'CR Noche',
        15
    );
    if (cr830) {
        allResults.push({
            country: 'Costa Rica',
            draw_name: 'Tica Noche',
            time: cr830.time,
            numbers: cr830.prizes
        });
    }

    // 9:50 PM - USA (Florida Noche)
    console.log('🇺🇸 USA (9:50 PM)');
    const usaFL = await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('Florida Noche')),
        'USA FL Noche',
        15
    );
    if (usaFL) {
        allResults.push({
            country: 'USA',
            draw_name: 'Florida Noche',
            time: '9:50 PM',
            numbers: usaFL.prizes
        });
    }

    // 10:00 PM - Nicaragua + Honduras (PARALLEL)
    console.log('⏰ 10:00 PM - Nicaragua + Honduras (parallel)');
    const [ni10, hn10] = await Promise.all([
        scrapeWithRetry(
            () => scrapeSuerteNica(),
            (results) => results?.find(r => r.time === '10:00 PM'),
            'Nicaragua 10PM',
            15
        ),
        scrapeWithRetry(
            () => scrapeHonduras(),
            (results) => results?.find(r => r.time === '10:00 PM'),
            'Honduras 10PM',
            15
        )
    ]);

    if (ni10) {
        allResults.push({
            country: 'Nicaragua',
            draw_name: 'Nica 10:00 PM',
            time: ni10.time,
            numbers: ni10.prizes
        });
    }

    if (hn10) {
        allResults.push({
            country: 'Honduras',
            draw_name: 'Honduras 10:00 PM',
            time: hn10.time,
            numbers: hn10.prizes
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
    }

    console.log('');
    console.log('Afternoon scraper completed!');
}

scrapeAfternoonDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
