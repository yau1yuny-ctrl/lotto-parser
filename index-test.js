import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - TEST MODE (Specific Date: 2026-01-11)');
console.log('='.repeat(60));
console.log('');

async function runTestScrapers() {
    // Use specific test date: January 11, 2026
    const testDate = '2026-01-11';

    console.log(`Test run for date: ${testDate}`);
    console.log('Fetching ALL results from this date (all times)');
    console.log('Note: Scrapers still validate date internally, but get all draws from that day');
    console.log('');

    const allResults = [];

    // Nicaragua
    console.log('🇳🇮 Scraping Nicaragua...');
    try {
        const nicaResults = await scrapeSuerteNica(testDate);
        if (nicaResults && nicaResults.length > 0) {
            console.log(`✅ Nicaragua: ${nicaResults.length} draws found`);
            nicaResults.forEach(r => {
                console.log(`   ${r.time}: ${r.prizes.join(', ')}`);
                allResults.push({
                    country: 'Nicaragua',
                    draw_date: testDate,
                    draw_time: r.time,
                    numbers: r.prizes
                });
            });
        } else {
            console.log('❌ Nicaragua: No results');
        }
    } catch (e) {
        console.error('❌ Nicaragua error:', e.message);
    }
    console.log('');

    // Honduras
    console.log('🇭🇳 Scraping Honduras...');
    try {
        const hondurasResults = await scrapeHonduras(testDate);
        if (hondurasResults && hondurasResults.length > 0) {
            console.log(`✅ Honduras: ${hondurasResults.length} draws found`);
            hondurasResults.forEach(r => {
                console.log(`   ${r.time}: ${r.prizes.join(', ')}`);
                allResults.push({
                    country: 'Honduras',
                    draw_date: testDate,
                    draw_time: r.time,
                    numbers: r.prizes
                });
            });
        } else {
            console.log('❌ Honduras: No results');
        }
    } catch (e) {
        console.error('❌ Honduras error:', e.message);
    }
    console.log('');

    // Costa Rica
    console.log('🇨🇷 Scraping Costa Rica...');
    try {
        const costaRicaResults = await scrapeCostaRica(testDate);
        if (costaRicaResults && costaRicaResults.length > 0) {
            console.log(`✅ Costa Rica: ${costaRicaResults.length} draws found`);
            costaRicaResults.forEach(r => {
                console.log(`   ${r.time}: ${r.prizes.join(', ')}`);
                allResults.push({
                    country: 'Costa Rica',
                    draw_date: testDate,
                    draw_time: r.time,
                    numbers: r.prizes
                });
            });
        } else {
            console.log('❌ Costa Rica: No results');
        }
    } catch (e) {
        console.error('❌ Costa Rica error:', e.message);
    }
    console.log('');

    // Panama
    console.log('🇵🇦 Scraping Panama...');
    try {
        const panamaResults = await scrapePanama(testDate);
        if (panamaResults && panamaResults.length > 0) {
            console.log(`✅ Panama: ${panamaResults.length} draws found`);
            panamaResults.forEach(r => {
                console.log(`   ${r.time}: ${r.prizes.join(', ')}`);
                allResults.push({
                    country: 'Panama',
                    draw_date: testDate,
                    draw_time: r.time,
                    numbers: r.prizes
                });
            });
        } else {
            console.log('❌ Panama: No results');
        }
    } catch (e) {
        console.error('❌ Panama error:', e.message);
    }
    console.log('');

    // Dominican Republic
    console.log('🇩🇴 Scraping Dominican Republic...');
    try {
        const domResults = await scrapeDominicanRepublic(testDate);
        if (domResults && domResults.length > 0) {
            console.log(`✅ Dominican Republic: ${domResults.length} draws found`);
            domResults.forEach(r => {
                console.log(`   ${r.hour}: ${r.numbers.join(', ')}`);
                allResults.push({
                    country: 'Dominican Republic',
                    draw_date: testDate,
                    draw_time: r.hour,
                    numbers: r.numbers
                });
            });
        } else {
            console.log('❌ Dominican Republic: No results');
        }
    } catch (e) {
        console.error('❌ Dominican Republic error:', e.message);
    }
    console.log('');

    // USA
    console.log('🇺🇸 Scraping USA...');
    try {
        const usaResults = await scrapeUSLotteries(testDate);
        if (usaResults && usaResults.length > 0) {
            console.log(`✅ USA: ${usaResults.length} draws found`);
            usaResults.forEach(r => {
                console.log(`   ${r.title}: ${r.prizes.join(', ')}`);
                allResults.push({
                    country: 'USA',
                    draw_date: testDate,
                    draw_time: r.title,
                    numbers: r.prizes
                });
            });
        } else {
            console.log('❌ USA: No results');
        }
    } catch (e) {
        console.error('❌ USA error:', e.message);
    }
    console.log('');

    // Save to Supabase
    console.log('='.repeat(60));
    console.log(`TOTAL RESULTS: ${allResults.length} draws from ${testDate}`);
    console.log('='.repeat(60));
    console.log('');

    if (allResults.length > 0) {
        console.log('Saving to Supabase...');

        // Group results by country for proper structure
        const resultsByCountry = {};
        allResults.forEach(result => {
            if (!resultsByCountry[result.country]) {
                resultsByCountry[result.country] = [];
            }
            resultsByCountry[result.country].push({
                time: result.draw_time,
                numbers: result.numbers
            });
        });

        // Save each country's results
        for (const [country, draws] of Object.entries(resultsByCountry)) {
            try {
                const { error } = await supabase
                    .from('lottery_results')
                    .insert([{
                        country: country,
                        draw_name: `${country} Test`,
                        draw_date: testDate,
                        data: draws,
                        scraped_at: new Date().toISOString()
                    }]);

                if (error) {
                    console.error(`❌ ${country} Supabase error:`, error);
                } else {
                    console.log(`✅ ${country}: Saved ${draws.length} draws to Supabase`);
                }
            } catch (e) {
                console.error(`❌ ${country} error:`, e.message);
            }
        }
    } else {
        console.log('⚠️  No results to save');
    }

    console.log('');
    console.log('Test scraper completed!');
}

runTestScrapers().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
