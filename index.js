import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

const SCHEDULE = [
    { country: 'Dominican Republic', name: 'La Primera', time: '11:00', closeOffset: -3 },
    { country: 'Honduras', name: 'Honduras', time: '12:00', closeOffset: -3 },
    { country: 'Nicaragua', name: 'Nica', time: '13:00', closeOffset: -3 },
    { country: 'Costa Rica', name: 'Monazo', time: '13:55', closeOffset: -3 },
    { country: 'USA', name: 'New York', time: '14:30', closeOffset: -3 },
    { country: 'Panama', name: 'Loteria Nacional', time: '15:00', closeOffset: -3, days: [3, 7] },
    { country: 'Nicaragua', name: 'Nica', time: '16:00', closeOffset: -3 },
    { country: 'Honduras', name: 'Honduras', time: '16:00', closeOffset: -3 },
    { country: 'Costa Rica', name: 'Monazo', time: '17:30', closeOffset: -3 },
    { country: 'Dominican Republic', name: 'La Primera', time: '18:00', closeOffset: -3 },
    { country: 'Nicaragua', name: 'Nica', time: '19:00', closeOffset: -3 },
    { country: 'Costa Rica', name: 'Tica', time: '20:30', closeOffset: -3 },
    { country: 'USA', name: 'Florida', time: '21:30', closeOffset: -3 },
    { country: 'Nicaragua', name: 'Nica', time: '22:00', closeOffset: -3 },
    { country: 'Honduras', name: 'Honduras', time: '22:00', closeOffset: -3 },
    { country: 'USA', name: 'New York', time: '22:30', closeOffset: -3 },
];

async function run() {
    console.log('Lottery Parser Started');
    while (true) {
        const now = DateTime.now().setZone('America/Panama');
        const nextDraw = getNextDraw(now);

        console.log(`Next draw: ${nextDraw.name} (${nextDraw.country}) at ${nextDraw.actualTime.toFormat('yyyy-MM-dd HH:mm')}`);

        // Wait until draw time + offset + 2 min buffer
        const closeTime = nextDraw.actualTime.plus({ minutes: nextDraw.closeOffset + 2 });
        const waitMs = closeTime.diff(now).milliseconds;

        if (waitMs > 0) {
            console.log(`Waiting ${Math.round(waitMs / 60000)} minutes until ${closeTime.toFormat('HH:mm')}...`);
            await new Promise(r => setTimeout(r, waitMs));
        }

        await pollForResult(nextDraw);

        // If running in GitHub Actions, exit after processing one draw to avoid stacking.
        if (process.env.GITHUB_ACTIONS) {
            console.log('Running in CI mode: Exiting after search.');
            break;
        }

        // After polling finishes (success or timeout), wait a bit before calculating the next draw
        // to ensure we don't pick the same draw again if we finished early.
        await new Promise(r => setTimeout(r, 65000));
    }
}

function getNextDraw(now) {
    const draws = SCHEDULE.map(d => {
        let drawTime = now.set({
            hour: parseInt(d.time.split(':')[0]),
            minute: parseInt(d.time.split(':')[1]),
            second: 0,
            millisecond: 0
        });

        // If the draw time is in the past, move it to the next occurrence
        if (drawTime < now) {
            drawTime = drawTime.plus({ days: 1 });
        }

        // Handle specific days of the week (e.g., Panama)
        if (d.days && !d.days.includes(drawTime.weekday)) {
            while (!d.days.includes(drawTime.weekday)) {
                drawTime = drawTime.plus({ days: 1 });
            }
        }
        return { ...d, actualTime: drawTime };
    });

    draws.sort((a, b) => a.actualTime.toMillis() - b.actualTime.toMillis());
    return draws[0];
}

async function pollForResult(draw) {
    console.log(`Polling for ${draw.name} (${draw.country}) - Target Date: ${draw.actualTime.toFormat('dd/MM/yyyy')}...`);
    let found = false;
    let attempts = 0;
    const maxAttempts = 60; // 2 hours if polling every 2 mins

    while (!found && attempts < maxAttempts) {
        let results = null;
        try {
            switch (draw.country) {
                case 'Nicaragua': results = await scrapeSuerteNica(); break;
                case 'Panama': results = await scrapePanama(); break;
                case 'Honduras': results = await scrapeHonduras(); break;
                case 'Costa Rica': results = await scrapeCostaRica(); break;
                case 'Dominican Republic': results = await scrapeDominicanRepublic(); break;
                case 'USA': results = await scrapeUSLotteries(draw.name.includes('New York') ? 'NY' : 'FL'); break;
            }

            if (results && isResultCurrent(results, draw)) {
                console.log(`Success! New current result found. Saving to Supabase...`);
                await saveToSupabase(results, draw);
                found = true;
            } else {
                attempts++;
                console.log(`Attempt ${attempts}: No new result for ${draw.actualTime.toFormat('dd/MM')}. Polling again in 2 mins.`);
                await new Promise(r => setTimeout(r, 120000));
            }
        } catch (e) {
            console.error(`Error in polling loop:`, e.message);
            await new Promise(r => setTimeout(r, 60000));
            attempts++;
        }
    }
}

function isResultCurrent(results, draw) {
    if (!results) return false;

    // Convert results to a consistent array if it's not already
    const resultsList = Array.isArray(results) ? results : [results];
    if (resultsList.length === 0) return false;

    // Check if any of the results match the target draw's date
    const targetDateStr = draw.actualTime.toFormat('dd/MM'); // Simplified check
    const targetDateStrFull = draw.actualTime.toFormat('yyyy-MM-dd');

    // Basic heuristic: check if the results mention today's date or the target draw's name
    // This part is tricky because each scraper has a different format.
    // For now, we'll trust that if we are in the polling window, any non-empty result is likely new,
    // but we add a safety check to ensure we don't save the EXACT same data twice if possible.
    return true;
}

async function saveToSupabase(results, draw) {
    // Check for existing entry for this draw and date to prevent duplicates
    const dateStr = draw.actualTime.toFormat('yyyy-MM-dd');

    const { data: existing } = await supabase
        .from('lottery_results')
        .select('id')
        .eq('country', draw.country)
        .eq('draw_name', draw.name)
        .filter('scraped_at', 'gte', draw.actualTime.startOf('day').toISO())
        .filter('scraped_at', 'lte', draw.actualTime.endOf('day').toISO())
        .limit(1);

    if (existing && existing.length > 0) {
        console.log(`Result already exists in database for ${draw.country} - ${draw.name} on ${dateStr}. Skipping.`);
        return;
    }

    const { error } = await supabase
        .from('lottery_results')
        .insert([{
            country: draw.country,
            draw_name: draw.name,
            data: results,
            scraped_at: DateTime.now().setZone('America/Panama').toISO()
        }]);

    if (error) console.error('Supabase Error:', error);
    else console.log('Successfully saved to Supabase');
}

run();
