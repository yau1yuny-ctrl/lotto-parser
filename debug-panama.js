import { scrapePanama } from './scrapers/panama.js';

console.log('🇵🇦 Scraping Lotería Nacional de Panamá...\n');

scrapePanama()
    .then(results => {
        console.log('\n--- RESULTADOS DE LOTERÍA NACIONAL ---\n');

        if (results && results.length > 0) {
            results.forEach((sorteo, index) => {
                console.log(`\n📊 ${sorteo.title}`);
                console.log('─'.repeat(50));

                sorteo.prizes.forEach((prize, i) => {
                    console.log(`   ${prize.label}: ${prize.number}`);
                });
            });

            console.log('\n\n--- DATOS EN FORMATO JSON ---\n');
            console.log(JSON.stringify(results, null, 2));
        } else {
            console.log('❌ No se encontraron resultados');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
