import { supabase } from './utils/supabase.js';
import { scrapeUSLotteries } from './scrapers/us_lotteries.js';
import { DateTime } from 'luxon';

async function updateUSAResults() {
    console.log('🇺🇸 Actualizando resultados de USA en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Eliminar el registro anterior de USA de hoy
        console.log('🗑️  Eliminando registro anterior de USA...');
        const { error: deleteError } = await supabase
            .from('lottery_results')
            .delete()
            .eq('country', 'USA')
            .eq('draw_date', today);

        if (deleteError) {
            console.error('❌ Error eliminando registro anterior:', deleteError);
        } else {
            console.log('✅ Registro anterior eliminado');
        }

        // Scrapear los nuevos resultados
        console.log('\n📍 Scraping USA lotteries...');
        const usaResults = await scrapeUSLotteries();

        if (usaResults && usaResults.length > 0) {
            console.log(`✅ Obtenidos ${usaResults.length} sorteos`);
            console.log('   Datos:', JSON.stringify(usaResults, null, 2));

            // Guardar los nuevos resultados
            const { error: insertError } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'USA',
                    draw_name: 'New York/Florida',
                    draw_date: today,
                    data: usaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (insertError) {
                console.error('❌ Error guardando nuevos resultados:', insertError);
            } else {
                console.log('\n✅ Resultados actualizados exitosamente en Supabase!');
                console.log(`\n📊 Resumen:`);
                usaResults.forEach((draw, i) => {
                    console.log(`   ${i + 1}. ${draw.title}: ${draw.prizes.join(', ')}`);
                });
            }
        } else {
            console.log('❌ No se obtuvieron resultados del scraper');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

updateUSAResults();
