import { scrapePanama } from './scrapers/panama.js';

async function testPanamaOfficial() {
    console.log('Testing OFFICIAL Panama LNB Results...');
    const results = await scrapePanama();

    if (results && results.length > 0) {
        console.log('\n--- OFFICIAL LNB RESULTS ---');
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log('\n⚠️ No results found. Check connection or selectors.');
    }
}

testPanamaOfficial();
