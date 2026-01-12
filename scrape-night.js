import { supabase } from './utils/supabase.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

console.log('='.repeat(60));
console.log('LOTTERY SCRAPER - NIGHT BLOCK (wait until draw time)');
console.log('Time: 10:20 PM - 12:30 AM Panama');
console.log('='.repeat(60));
console.log('');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilDrawTime(drawTime) {
    const now = DateTime.now().setZone('America/Panama');
    const [hour, minute] = drawTime.split(':');
    const period = drawTime.includes('PM') ? 'PM' : 'AM';

    let targetHour = parseInt(hour);
    if (period === 'PM' && targetHour !== 12) targetHour += 12;
    if (period === 'AM' && targetHour === 12) targetHour = 0;

    let target = now.set({
        hour: targetHour,
        minute: parseInt(minute.replace(/[^\d]/g, '')),
        second: 0,
        millisecond: 0
    });

    const waitMs = target.diff(now).milliseconds;

    // Only wait if the time hasn't passed yet
    if (waitMs > 0) {
        const waitMinutes = Math.round(waitMs / 60000);
        console.log(`⏰ Waiting ${waitMinutes} minutes until ${drawTime}...`);
        await sleep(waitMs);
        console.log(`✅ It's ${drawTime} - starting search now!`);
    } else {
        console.log(`✅ ${drawTime} already passed - starting search immediately!`);
    }
}

async function saveToSupabase(country, drawName, time, numbers, date) {
    try {
        // Use upsert to replace if exists (based on country + draw_name + draw_date)
        const { error } = await supabase
            .from('lottery_results')
            .upsert([{
                country: country,
                draw_name: drawName,
                draw_date: date,
                data: [{ time: time, numbers: numbers }],
                scraped_at: new Date().toISOString()
            }], {
                onConflict: 'country,draw_name,draw_date'  // Unique constraint
            });

        if (error) {
            console.error(`❌ Supabase error:`, error);
            return false;
        } else {
            console.log(`💾 Saved to Supabase: ${country} ${time}`);
            return true;
        }
    } catch (e) {
        console.error(`❌ Save error:`, e.message);
        return false;
    }
}

async function scrapeWithRetry(scrapeFn, filterFn, name, saveData, maxAttempts = 30) {
    let found = false;
    let attempts = 0;

    console.log(`🔄 Starting retry loop for ${name}...`);
    console.log(`Max attempts: ${maxAttempts} (retry every 2 minutes)`);
    console.log('');

    while (!found && attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} for ${name}...`);

        try {
            const results = await scrapeFn();
            const result = filterFn(results);

            if (result) {
                console.log(`✅ ${name} found!`);

                // Save immediately to Supabase
                await saveToSupabase(
                    saveData.country,
                    saveData.drawName,
                    saveData.time,
                    result.prizes,
                    saveData.date
                );

                found = true;
                return result;
            } else {
                if (attempts < maxAttempts) {
                    console.log(`⏳ ${name} not found yet. Waiting 2 minutes before retry...`);
                    await sleep(120000); // 2 minutes
                } else {
                    console.log(`❌ ${name} not found after ${maxAttempts} attempts. Giving up.`);
                }
            }
        } catch (e) {
            console.error(`❌ Error on attempt ${attempts}:`, e.message);
            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting 2 minutes before retry...`);
                await sleep(120000);
            }
        }
    }

    return null;
}

async function scrapeNightDraws() {
    const now = DateTime.now().setZone('America/Panama');
    const today = now.toFormat('yyyy-MM-dd');

    console.log(`Running night scraper for: ${today}`);
    console.log(`Started at: ${now.toFormat('HH:mm')}`);
    console.log('');

    // 11:30 PM - USA (New York) - wait until draw time
    console.log('🇺🇸 USA (11:30 PM)');
    await waitUntilDrawTime('11:30 PM');
    await scrapeWithRetry(
        () => scrapeUSLotteries(),
        (results) => results?.find(r => r.title.includes('New York 11:30')),
        'USA New York 11:30 PM',
        {
            country: 'USA',
            drawName: 'New York 11:30 PM',
            time: '11:30 PM',
            date: today
        },
        30 // 30 attempts = 1 hour
    );

    console.log('');
    console.log('='.repeat(60));
    console.log('Night scraper completed!');
    console.log('='.repeat(60));
}

scrapeNightDraws().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
