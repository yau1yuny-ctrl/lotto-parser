import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';

console.log('='.repeat(60));
console.log('TEST: MORNING BLOCK - No Supabase');
console.log('Testing with date: 2026-01-11 (yesterday)');
console.log('='.repeat(60));
console.log('');

async function testMorningBlock() {
    const testDate = '2026-01-11';

    console.log(`Testing morning scraper for: ${testDate}`);
    console.log('Expected: 8 draws');
    console.log('');

    const results = {
        found: 0,
        expected: 8,
        details: []
    };

    // 11:00 AM - Dominican Republic
    console.log('🇩🇴 Testing Dominican Republic (11:00 AM)...');
    try {
        const domResults = await scrapeDominicanRepublic(testDate);
        const diaResult = domResults?.find(r => r.name.includes('Día'));
        if (diaResult) {
            console.log(`✅ Found: ${diaResult.numbers.join(', ')}`);
            results.found++;
            results.details.push({ country: 'DR', time: '11:00 AM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'DR', time: '11:00 AM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'DR', time: '11:00 AM', status: 'ERROR' });
    }

    // 12:00 PM - Honduras
    console.log('🇭🇳 Testing Honduras (12:00 PM)...');
    try {
        const hondurasResults = await scrapeHonduras(testDate);
        const noonResult = hondurasResults?.find(r => r.time === '12:00 PM');
        if (noonResult) {
            console.log(`✅ Found: ${noonResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'HN', time: '12:00 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'HN', time: '12:00 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'HN', time: '12:00 PM', status: 'ERROR' });
    }

    // 1:00 PM - Nicaragua
    console.log('🇳🇮 Testing Nicaragua (1:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica(testDate);
        const pmResult = nicaResults?.find(r => r.time === '1:00 PM');
        if (pmResult) {
            console.log(`✅ Found: ${pmResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'NI', time: '1:00 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'NI', time: '1:00 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'NI', time: '1:00 PM', status: 'ERROR' });
    }

    // 2:55 PM - Costa Rica
    console.log('🇨🇷 Testing Costa Rica (2:55 PM)...');
    try {
        const costaRicaResults = await scrapeCostaRica(testDate);
        const mediodiaResult = costaRicaResults?.find(r => r.time === '2:55 PM');
        if (mediodiaResult) {
            console.log(`✅ Found: ${mediodiaResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'CR', time: '2:55 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'CR', time: '2:55 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'CR', time: '2:55 PM', status: 'ERROR' });
    }

    // 3:30 PM - USA
    console.log('🇺🇸 Testing USA (3:30 PM)...');
    try {
        const usaResults = await scrapeUSLotteries(testDate);
        const nyResult = usaResults?.find(r => r.title.includes('New York 3:30'));
        if (nyResult) {
            console.log(`✅ Found: ${nyResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'US', time: '3:30 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'US', time: '3:30 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'US', time: '3:30 PM', status: 'ERROR' });
    }

    // 3:30 PM - Panama
    console.log('🇵🇦 Testing Panama (3:30 PM - Sunday)...');
    try {
        const panamaResults = await scrapePanama(testDate);
        if (panamaResults && panamaResults.length > 0) {
            console.log(`✅ Found: ${panamaResults[0].prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'PA', time: '3:30 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'PA', time: '3:30 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'PA', time: '3:30 PM', status: 'ERROR' });
    }

    // 4:00 PM - Nicaragua
    console.log('🇳🇮 Testing Nicaragua (4:00 PM)...');
    try {
        const nicaResults = await scrapeSuerteNica(testDate);
        const pmResult = nicaResults?.find(r => r.time === '4:00 PM');
        if (pmResult) {
            console.log(`✅ Found: ${pmResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'NI', time: '4:00 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'NI', time: '4:00 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'NI', time: '4:00 PM', status: 'ERROR' });
    }

    // 4:00 PM - Honduras
    console.log('🇭🇳 Testing Honduras (4:00 PM)...');
    try {
        const hondurasResults = await scrapeHonduras(testDate);
        const pmResult = hondurasResults?.find(r => r.time === '4:00 PM');
        if (pmResult) {
            console.log(`✅ Found: ${pmResult.prizes.join(', ')}`);
            results.found++;
            results.details.push({ country: 'HN', time: '4:00 PM', status: 'OK' });
        } else {
            console.log('❌ Not found');
            results.details.push({ country: 'HN', time: '4:00 PM', status: 'MISSING' });
        }
    } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        results.details.push({ country: 'HN', time: '4:00 PM', status: 'ERROR' });
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('MORNING BLOCK TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Expected: ${results.expected} draws`);
    console.log(`Found: ${results.found} draws`);
    console.log('');

    if (results.found === results.expected) {
        console.log('✅ SUCCESS: All morning draws found!');
    } else {
        console.log(`⚠️  WARNING: Only ${results.found}/${results.expected} draws found`);
        console.log('');
        console.log('Details:');
        results.details.forEach(d => {
            const icon = d.status === 'OK' ? '✅' : '❌';
            console.log(`  ${icon} ${d.country} ${d.time}: ${d.status}`);
        });
    }

    console.log('');
    console.log('Test completed!');
    process.exit(results.found === results.expected ? 0 : 1);
}

testMorningBlock().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
