import { supabase } from './utils/supabase.js';
import { DateTime } from 'luxon';

async function savePanamaTestData() {
    console.log('🇵🇦 Guardando datos de prueba de Panamá...\n');
    const today = DateTime.now().setZone('America/Panama').toFormat('yyyy-MM-dd');

    // Datos de prueba con la estructura real del scraper
    const testData = [
        {
            "title": "Sorteo Dominical",
            "date": "10 de Enero de 2026", // Fecha ficticia para prueba
            "prizes": [
                { "label": "PRIMER PREMIO", "number": "0587" },
                { "label": "SEGUNDO PREMIO", "number": "6963" },
                { "label": "TERCER PREMIO", "number": "4590" }
            ]
        },
        {
            "title": "Sorteo Miercolito",
            "date": "10 de Enero de 2026",
            "prizes": [
                { "label": "PRIMER PREMIO", "number": "8884" },
                { "label": "SEGUNDO PREMIO", "number": "4130" },
                { "label": "TERCER PREMIO", "number": "5506" }
            ]
        }
    ];

    try {
        const { error } = await supabase
            .from('lottery_results')
            .insert({
                country: 'Panama',
                draw_name: 'Loteria Nacional',
                draw_date: today,
                data: testData,
                scraped_at: DateTime.now().setZone('America/Panama').toISO()
            });

        if (error) {
            console.error('❌ Error guardando:', error);
        } else {
            console.log('✅ Datos de prueba guardados en Supabase!');
            console.log('\n📊 Estructura del array:');
            console.log(JSON.stringify(testData, null, 2));
            console.log('\n⚠️  Nota: Estos son datos de prueba para ver la estructura.');
            console.log('   En producción, solo se guardarán sorteos del día actual.');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

savePanamaTestData();
