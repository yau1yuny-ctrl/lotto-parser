import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - MORNING BLOCK');
console.log('Time: 10:50 AM - 4:50 PM Panama');
console.log('='.repeat(60));
console.log('');

async function scrapeMorningDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');
    const dayOfWeek = now.weekday; // 1=Monday, 7=Sunday

    console.log(`Running morning scraper for: ${today}`);
    console.log(`Day of week: ${dayOfWeek} (${now.toFormat('cccc')})`);
    console.log('');

    const allResults = [];

    // 11:00 AM - Dominican Republic (La Primera Día)
    console.log('🇩🇴 Scraping Dominican Republic (11:00 AM)...');
    try {
        const domResults = await scrapeDominicanRepublic();
        const diaResult = domResults?.find(r => r.name.includes('Día'));
        if (diaResult) {
            console.log(`✅ Dominican Republic Día: ${diaResult.numbers.join(', ')}`);
            allResults.push({
                country: 'Dominican Republic',
                draw_name: 'La Primera Día',
                time: diaResult.hour,
                numbers: diaResult.numbers
            });
        }
    } catch (e) {
        console.error('❌ Dominican Republic error:', e.message);
    }

    // 12:00 PM - Honduras
    console.log('🇭🇳 Scraping Honduras (12:00 PM)...');
    try {
        const hondurasResults = await scrapeHonduras();
        const noonResult = hondurasResults?.find(r => r.time === '12:00 PM');
        if (noonResult) {
            console.log(`✅ Honduras 12:00 PM: ${noonResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Honduras',
                draw_name: 'Honduras 12:00 PM',
                time: noonResult.time,
                numbers: noonResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Honduras error:', e.message);
    }

    // 1:00 PM - Nicaragua
    console.log('🇳🇮 Scraping Nicaragua (1:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica();
        const pmResult = nicaResults?.find(r => r.time === '1:00 PM');
        if (pmResult) {
            console.log(`✅ Nicaragua 1:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Nicaragua',
                draw_name: 'Nica 1:00 PM',
                time: pmResult.time,
                numbers: pmResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Nicaragua error:', e.message);
    }

    // 2:55 PM - Costa Rica (Mediodía)
    console.log('🇨🇷 Scraping Costa Rica (2:55 PM)...');
    try {
        const costaRicaResults = await scrapeCostaRica();
        const mediodiaResult = costaRicaResults?.find(r => r.time === '2:55 PM');
        if (mediodiaResult) {
            console.log(`✅ Costa Rica Mediodía: ${mediodiaResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Costa Rica',
                draw_name: 'Monazo Mediodía',
                time: mediodiaResult.time,
                numbers: mediodiaResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Costa Rica error:', e.message);
    }

    // 3:30 PM - USA (New York)
    console.log('🇺🇸 Scraping USA (3:30 PM)...');
    try {
        const usaResults = await scrapeUSLotteries();
        const nyResult = usaResults?.find(r => r.title.includes('New York 3:30'));
        if (nyResult) {
            console.log(`✅ USA New York 3:30: ${nyResult.prizes.join(', ')}`);
            allResults.push({
                country: 'USA',
                draw_name: 'New York 3:30 PM',
                time: '3:30 PM',
                numbers: nyResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ USA error:', e.message);
    }

    // 3:30 PM - Panama (Miércoles=3 y Domingo=7)
    if (dayOfWeek === 3 || dayOfWeek === 7) {
        console.log('🇵🇦 Scraping Panama (3:30 PM - Wednesday/Sunday)...');
        try {
            const panamaResults = await scrapePanama();
            if (panamaResults && panamaResults.length > 0) {
                console.log(`✅ Panama: ${panamaResults[0].prizes.join(', ')}`);
                allResults.push({
                    country: 'Panama',
                    draw_name: 'Loteria Nacional',
                    time: panamaResults[0].time,
                    numbers: panamaResults[0].prizes
                });
            }
        } catch (e) {
            console.error('❌ Panama error:', e.message);
        }
    } else {
        console.log('⏭️  Panama: Not Wednesday or Sunday, skipping');
    }

    // 4:00 PM - Nicaragua
    console.log('🇳🇮 Scraping Nicaragua (4:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica();
        const pmResult = nicaResults?.find(r => r.time === '4:00 PM');
        if (pmResult) {
            console.log(`✅ Nicaragua 4:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Nicaragua',
                draw_name: 'Nica 4:00 PM',
                time: pmResult.time,
                numbers: pmResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Nicaragua error:', e.message);
    }

    // 4:00 PM - Honduras
    console.log('🇭🇳 Scraping Honduras (4:00 PM)...');
    try {
        const hondurasResults = await scrapeHonduras();
        const pmResult = hondurasResults?.find(r => r.time === '4:00 PM');
        if (pmResult) {
            console.log(`✅ Honduras 4:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Honduras',
                draw_name: 'Honduras 4:00 PM',
                time: pmResult.time,
                numbers: pmResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Honduras error:', e.message);
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
