import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - AFTERNOON BLOCK');
console.log('Time: 4:50 PM - 10:50 PM Panama');
console.log('='.repeat(60));
console.log('');

async function scrapeAfternoonDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running afternoon scraper for: ${today}`);
    console.log('');

    const allResults = [];

    // 5:30 PM - Costa Rica (Tarde)
    console.log('🇨🇷 Scraping Costa Rica (5:30 PM)...');
    try {
        const costaRicaResults = await scrapeCostaRica();
        const tardeResult = costaRicaResults?.find(r => r.time === '5:30 PM');
        if (tardeResult) {
            console.log(`✅ Costa Rica Tarde: ${tardeResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Costa Rica',
                draw_name: 'Monazo Tarde',
                time: tardeResult.time,
                numbers: tardeResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Costa Rica error:', e.message);
    }

    // 7:00 PM - Dominican Republic (La Primera Noche)
    console.log('🇩🇴 Scraping Dominican Republic (7:00 PM)...');
    try {
        const domResults = await scrapeDominicanRepublic();
        const nocheResult = domResults?.find(r => r.name.includes('Noche'));
        if (nocheResult) {
            console.log(`✅ Dominican Republic Noche: ${nocheResult.numbers.join(', ')}`);
            allResults.push({
                country: 'Dominican Republic',
                draw_name: 'La Primera Noche',
                time: nocheResult.hour,
                numbers: nocheResult.numbers
            });
        }
    } catch (e) {
        console.error('❌ Dominican Republic error:', e.message);
    }

    // 7:00 PM - Nicaragua
    console.log('🇳🇮 Scraping Nicaragua (7:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica();
        const pmResult = nicaResults?.find(r => r.time === '7:00 PM');
        if (pmResult) {
            console.log(`✅ Nicaragua 7:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Nicaragua',
                draw_name: 'Nica 7:00 PM',
                time: pmResult.time,
                numbers: pmResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Nicaragua error:', e.message);
    }

    // 8:30 PM - Costa Rica (Noche)
    console.log('🇨🇷 Scraping Costa Rica (8:30 PM)...');
    try {
        const costaRicaResults = await scrapeCostaRica();
        const nocheResult = costaRicaResults?.find(r => r.time === '8:30 PM');
        if (nocheResult) {
            console.log(`✅ Costa Rica Noche: ${nocheResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Costa Rica',
                draw_name: 'Tica Noche',
                time: nocheResult.time,
                numbers: nocheResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Costa Rica error:', e.message);
    }

    // 9:50 PM - USA (Florida Noche)
    console.log('🇺🇸 Scraping USA (9:50 PM)...');
    try {
        const usaResults = await scrapeUSLotteries();
        const flResult = usaResults?.find(r => r.title.includes('Florida Noche'));
        if (flResult) {
            console.log(`✅ USA Florida Noche: ${flResult.prizes.join(', ')}`);
            allResults.push({
                country: 'USA',
                draw_name: 'Florida Noche',
                time: '9:50 PM',
                numbers: flResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ USA error:', e.message);
    }

    // 10:00 PM - Nicaragua
    console.log('🇳🇮 Scraping Nicaragua (10:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica();
        const pmResult = nicaResults?.find(r => r.time === '10:00 PM');
        if (pmResult) {
            console.log(`✅ Nicaragua 10:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Nicaragua',
                draw_name: 'Nica 10:00 PM',
                time: pmResult.time,
                numbers: pmResult.prizes
            });
        }
    } catch (e) {
        console.error('❌ Nicaragua error:', e.message);
    }

    // 10:00 PM - Honduras
    console.log('🇭🇳 Scraping Honduras (10:00 PM)...');
    try {
        const hondurasResults = await scrapeHonduras();
        const pmResult = hondurasResults?.find(r => r.time === '10:00 PM');
        if (pmResult) {
            console.log(`✅ Honduras 10:00 PM: ${pmResult.prizes.join(', ')}`);
            allResults.push({
                country: 'Honduras',
                draw_name: 'Honduras 10:00 PM',
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
    console.log('Afternoon scraper completed!');
}

scrapeAfternoonDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
