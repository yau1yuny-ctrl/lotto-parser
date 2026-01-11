import { supabase } from './utils/supabase.js';
import { scrapeHonduras } from './scrapers/honduras.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { scrapeCostaRica } from './scrapers/costa_rica.js';
import { scrapeDominicanRepublic } from './scrapers/dominican_republic.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

async function saveTestResults() {
    console.log('🔄 Guardando resultados de prueba en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Honduras
        console.log('📍 Scraping Honduras...');
        const hondurasResults = await scrapeHonduras();
        if (hondurasResults && hondurasResults.length > 0) {
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Honduras',
                    draw_name: 'Honduras',
                    draw_date: today,
                    data: hondurasResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando Honduras:', error);
            } else {
                console.log('✅ Honduras guardado');
                console.log('   Datos:', JSON.stringify(hondurasResults, null, 2));
            }
        }

        // Nicaragua
        console.log('\n📍 Scraping Nicaragua...');
        const nicaraguaResults = await scrapeSuerteNica();
        if (nicaraguaResults && nicaraguaResults.length > 0) {
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Nicaragua',
                    draw_name: 'Nica',
                    draw_date: today,
                    data: nicaraguaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando Nicaragua:', error);
            } else {
                console.log('✅ Nicaragua guardado');
                console.log('   Datos:', JSON.stringify(nicaraguaResults, null, 2));
            }
        }

        // Costa Rica
        console.log('\n📍 Scraping Costa Rica...');
        const costaRicaResults = await scrapeCostaRica();
        if (costaRicaResults && costaRicaResults.length > 0) {
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Costa Rica',
                    draw_name: 'Monazo',
                    draw_date: today,
                    data: costaRicaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando Costa Rica:', error);
            } else {
                console.log('✅ Costa Rica guardado');
                console.log('   Datos:', JSON.stringify(costaRicaResults, null, 2));
            }
        }

        // República Dominicana
        console.log('\n📍 Scraping República Dominicana...');
        const dominicanResults = await scrapeDominicanRepublic();
        if (dominicanResults && dominicanResults.length > 0) {
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Dominican Republic',
                    draw_name: 'La Primera',
                    draw_date: today,
                    data: dominicanResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando República Dominicana:', error);
            } else {
                console.log('✅ República Dominicana guardado');
                console.log('   Datos:', JSON.stringify(dominicanResults, null, 2));
            }
        }

        // USA
        console.log('\n📍 Scraping USA...');
        const usaResults = await scrapeUSLotteries();
        if (usaResults && usaResults.length > 0) {
            const { error } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'USA',
                    draw_name: 'New York/Florida',
                    draw_date: today,
                    data: usaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (error) {
                console.error('❌ Error guardando USA:', error);
            } else {
                console.log('✅ USA guardado');
                console.log('   Datos:', JSON.stringify(usaResults, null, 2));
            }
        }

        console.log('\n✅ Proceso completado!');
        console.log(`\n📊 Puedes ver los resultados en Supabase:`);
        console.log(`   Tabla: lottery_results`);
        console.log(`   Fecha: ${today}`);

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

saveTestResults();
