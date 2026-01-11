import { supabase } from './utils/supabase.js';
import { scrapeSuerteNica } from './scrapers/nicaragua.js';
import { DateTime } from 'luxon';

async function updateNicaraguaResults() {
    console.log('🔄 Actualizando resultados de Nicaragua en Supabase...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    try {
        // Primero, eliminar el registro anterior de Nicaragua de hoy
        console.log('🗑️  Eliminando registro anterior de Nicaragua...');
        const { error: deleteError } = await supabase
            .from('lottery_results')
            .delete()
            .eq('country', 'Nicaragua')
            .eq('draw_date', today);

        if (deleteError) {
            console.error('❌ Error eliminando registro anterior:', deleteError);
        } else {
            console.log('✅ Registro anterior eliminado');
        }

        // Scrapear los nuevos resultados
        console.log('\n📍 Scraping Nicaragua con el scraper corregido...');
        const nicaraguaResults = await scrapeSuerteNica();

        if (nicaraguaResults && nicaraguaResults.length > 0) {
            console.log(`✅ Obtenidos ${nicaraguaResults.length} sorteos`);
            console.log('   Datos:', JSON.stringify(nicaraguaResults, null, 2));

            // Guardar los nuevos resultados
            const { error: insertError } = await supabase
                .from('lottery_results')
                .insert({
                    country: 'Nicaragua',
                    draw_name: 'Nica',
                    draw_date: today,
                    data: nicaraguaResults,
                    scraped_at: DateTime.now().setZone('America/Panama').toISO()
                });

            if (insertError) {
                console.error('❌ Error guardando nuevos resultados:', insertError);
            } else {
                console.log('\n✅ Resultados actualizados exitosamente en Supabase!');
                console.log(`\n📊 Resumen:`);
                nicaraguaResults.forEach((draw, i) => {
                    console.log(`   ${i + 1}. ${draw.time}: ${draw.prizes.join(', ')}`);
                });
            }
        } else {
            console.log('❌ No se obtuvieron resultados del scraper');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

updateNicaraguaResults();
