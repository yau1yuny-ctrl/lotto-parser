import { scrapeCostaRica } from './scrapers/costa_rica.js';

async function testCRStealth() {
    console.log('Testing REFINED Costa Rica Scraper with Stealth...');
    const results = await scrapeCostaRica();

    if (results && results.length > 0) {
        console.log('\n--- COSTA RICA RESULTS ---');
        results.forEach(res => {
            console.log(`\nDraw: ${res.time}`);
            console.log(`1er Premio (NT): ${res.prizes[0]}`);
            console.log(`2do Premio (M1+M2): ${res.prizes[1]}`);
            console.log(`3er Premio (M2+M3): ${res.prizes[2]}`);
        });
    } else {
        console.log('\n⚠️ No results found. Check bypass or selectors.');
    }
}

testCRStealth();
