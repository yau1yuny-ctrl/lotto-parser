import { scrapeHonduras } from './scrapers/honduras.js';

async function testHondurasComposite() {
    console.log('Testing COMPOSITE Honduras Results...');
    const results = await scrapeHonduras();

    if (results && results.length > 0) {
        console.log('\n--- COMPOSITE HONDURAS RESULTS ---');
        results.forEach(res => {
            console.log(`\nDraw: ${res.time}`);
            console.log(`1er Premio (Diaria): ${res.prizes[0]}`);
            console.log(`2do Premio (Premia2 #1): ${res.prizes[1]}`);
            console.log(`3er Premio (Premia2 #2): ${res.prizes[2]}`);
        });
    } else {
        console.log('\n⚠️ No results found. Check if the "ultimos-resultados" page structure has changed.');
    }
}

testHondurasComposite();
