import { scrapeUSLotteries } from './scrapers/us_lotteries.js';

console.log('Testing USA Lotteries Scraper with Validation...\n');

scrapeUSLotteries()
    .then(results => {
        console.log('\n--- USA LOTTERIES RESULTS ---\n');

        let hasErrors = false;

        if (!results || results.length === 0) {
            console.error('❌ ERROR: No results found');
            process.exit(1);
        }

        results.forEach(lottery => {
            console.log(`${lottery.title}`);
            console.log(`Prizes: ${lottery.prizes.join(' - ')}`);

            // Validate that we have 3 prizes
            if (!lottery.prizes || lottery.prizes.length !== 3) {
                console.error(`  ❌ ERROR: Expected 3 prizes, got ${lottery.prizes?.length || 0}`);
                hasErrors = true;
            }

            // Validate number format (should be 2 digits)
            lottery.prizes.forEach(prize => {
                if (!/^\d{2}$/.test(prize)) {
                    console.error(`  ❌ ERROR: Invalid prize format "${prize}" (expected 2 digits)`);
                    hasErrors = true;
                }
            });

            console.log('');
        });

        // Check that we have New York and Florida
        const titles = results.map(r => r.title.toLowerCase());
        if (!titles.some(t => t.includes('new york') || t.includes('york'))) {
            console.error('❌ ERROR: Missing "New York" results');
            hasErrors = true;
        }
        if (!titles.some(t => t.includes('florida'))) {
            console.error('❌ ERROR: Missing "Florida" results');
            hasErrors = true;
        }

        if (hasErrors) {
            console.error('\n❌ TEST FAILED: Validation errors found');
            process.exit(1);
        } else {
            console.log('✅ TEST PASSED: All validations successful');
        }
    })
    .catch(err => {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    });
