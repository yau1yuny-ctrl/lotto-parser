import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - MORNING BLOCK (with retry)');
console.log('Time: 10:50 AM - 4:50 PM Panama');
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

async function scrapeMorningDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');
    const dayOfWeek = now.weekday;

    console.log(`Running morning scraper for: ${today}`);
    console.log(`Day of week: ${dayOfWeek} (${now.toFormat('cccc')})`);
    console.log('');

    const allResults = [];

    // 11:00 AM - Dominican Republic (La Primera Día)
    console.log('🇩🇴 Dominican Republic (11:00 AM)');
    const domDia = await scrapeWithRetry(
        () => scrapeDominicanRepublic(),
        (results) => results?.find(r => r.name.includes('Día')),
        'DR Día',
        15
    );
    if (domDia) {
        allResults.push({
            country: 'Dominican Republic',
            draw_name: 'La Primera Día',
            time: domDia.hour,
            numbers: domDia.numbers
        });
    }

    // 12:00 PM - Honduras
    console.log('🇭🇳 Honduras (12:00 PM)');
    const hn12 = await scrapeWithRetry(
        () => scrapeHonduras(),
        (results) => results?.find(r => r.time === '12:00 PM'),
        'Honduras 12PM',
        15
    );
    if (hn12) {
        allResults.push({
            country: 'Honduras',
            draw_name: 'Honduras 12:00 PM',
            time: hn12.time,
            numbers: hn12.prizes
        });
    }

    // 1:00 PM - Nicaragua
    console.log('🇳🇮 Nicaragua (1:00 PM)');
    const ni1 = await scrapeWithRetry(
        () => scrapeSuerteNica(),
        (results) => results?.find(r => r.time === '1:00 PM'),
        'Nicaragua 1PM',
        15
    );
    if (ni1) {
        allResults.push({
            country: 'Nicaragua',
            draw_name: 'Nica 1:00 PM',
            time: ni1.time,
            numbers: ni1.prizes
        });
    }

    // 2:55 PM - Costa Rica (Mediodía)
    console.log('🇨🇷 Costa Rica (2:55 PM)');
    const cr255 = await scrapeWithRetry(
        () => scrapeCostaRica(),
        (results) => results?.find(r => r.time === '2:55 PM'),
        'CR Mediodía',
        15
    );
    if (cr255) {
        allResults.push({
            country: 'Costa Rica',
            draw_name: 'Monazo Mediodía',
            time: cr255.time,
            numbers: cr255.prizes
        });
    }

    // 3:30 PM - USA (New York)
    console.log('🇺🇸 USA (3:30 PM)');
    const usa330 = await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('New York 3:30')),
        'USA NY 3:30PM',
        15
    );
    if (usa330) {
        allResults.push({
            country: 'USA',
            draw_name: 'New York 3:30 PM',
            time: '3:30 PM',
            numbers: usa330.prizes
        });
    }

    // 3:30 PM - Panama (Miércoles=3 y Domingo=7)
    if (dayOfWeek === 3 || dayOfWeek === 7) {
        console.log('🇵🇦 Panama (3:30 PM - Wednesday/Sunday)');
        const pa = await scrapeWithRetry(
            () => scrapePanama(),
            (results) => results && results.length > 0 ? results[0] : null,
            'Panama',
            15
        );
        if (pa) {
            allResults.push({
                country: 'Panama',
                draw_name: 'Loteria Nacional',
                time: pa.time,
                numbers: pa.prizes
            });
        }
    } else {
        console.log('⏭️  Panama: Not Wednesday or Sunday, skipping');
    }

    // 4:00 PM - Nicaragua
    console.log('🇳🇮 Nicaragua (4:00 PM)');
    const ni4 = await scrapeWithRetry(
        () => scrapeSuerteNica(),
        (results) => results?.find(r => r.time === '4:00 PM'),
        'Nicaragua 4PM',
        15
    );
    if (ni4) {
        allResults.push({
            country: 'Nicaragua',
            draw_name: 'Nica 4:00 PM',
            time: ni4.time,
            numbers: ni4.prizes
        });
    }

    // 4:00 PM - Honduras
    console.log('🇭🇳 Honduras (4:00 PM)');
    const hn4 = await scrapeWithRetry(
        () => scrapeHonduras(),
        (results) => results?.find(r => r.time === '4:00 PM'),
        'Honduras 4PM',
        15
    );
    if (hn4) {
        allResults.push({
            country: 'Honduras',
            draw_name: 'Honduras 4:00 PM',
            time: hn4.time,
            numbers: hn4.prizes
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
    console.log('Morning scraper completed!');
}

scrapeMorningDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
