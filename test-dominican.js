import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';

console.log('Testing Dominican Republic Scraper with Validation...\n');

scrapeDominicanRepublic()
    .then(results => {
        console.log('\n--- DOMINICAN REPUBLIC RESULTS ---\n');

        let hasErrors = false;

        if (!results || results.length === 0) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        results.forEach(lottery => {
            console.log(`Lottery: ${lottery.name}`);
            console.log(`Date: ${lottery.date} - ${lottery.hour}`);
            console.log(`Numbers: ${lottery.numbers.join(' - ')}`);

            // Validate that we have numbers
            if (!lottery.numbers || lottery.numbers.length === 0) {
                console.error(`  ❌ ERROR: No numbers found for ${lottery.name}`);
                hasErrors = true;
            }

            // Validate number format (should be 2 digits)
            lottery.numbers.forEach(num => {
                if (!/^\d{2}$/.test(num)) {
                    console.error(`  ❌ ERROR: Invalid number format "${num}" (expected 2 digits)`);
                    hasErrors = true;
                }
            });

            console.log('');
        });

        if (hasErrors) {
            console.error('❌ TEST FAILED: Validation errors found');
            process.exit(1);
        } else {
            console.log('✅ TEST PASSED: All validations successful');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
