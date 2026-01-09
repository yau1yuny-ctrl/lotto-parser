import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapePanama } from './scrapers/panama.js';
import { scrapeHonduras } from './scrapers/honduras_v4.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

// Forced update to ensure encoding is correct
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

        console.log(`Next draw: ${nextDraw.name} (${nextDraw.country}) at ${nextDraw.time}`);

        const closeTime = now.set({
            hour: parseInt(nextDraw.time.split(':')[0]),
            minute: parseInt(nextDraw.time.split(':')[1])
        }).plus({ minutes: nextDraw.closeOffset + 2 });

        const waitMs = closeTime.diff(now).milliseconds;
        if (waitMs > 0) {
            console.log(`Waiting ${Math.round(waitMs / 60000)} minutes...`);
            await new Promise(r => setTimeout(r, waitMs));
        }

        await pollForResult(nextDraw);
    }
}

function getNextDraw(now) {
    const draws = SCHEDULE.map(d => {
        let drawTime = now.set({
            hour: parseInt(d.time.split(':')[0]),
            minute: parseInt(d.time.split(':')[1])
        });
        if (drawTime < now) drawTime = drawTime.plus({ days: 1 });
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
    console.log(`Polling for ${draw.name} (${draw.country})...`);
    let found = false;
    let attempts = 0;
    while (!found && attempts < 60) {
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
                console.log(`Success! Saving to Supabase...`);
                await saveToSupabase(results, draw);
                found = true;
            } else {
                attempts++;
                console.log(`Attempt ${attempts}: No new result. Polling again in 2 mins.`);
                await new Promise(r => setTimeout(r, 120000));
            }
        } catch (e) {
            console.error(`Error in polling loop:`, e);
            await new Promise(r => setTimeout(r, 60000));
        }
    }
}

function isResultCurrent(results, draw) {
    return results && (Array.isArray(results) ? results.length > 0 : Object.keys(results).length > 0);
}

async function saveToSupabase(results, draw) {
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
