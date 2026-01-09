import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePanama() {
    try {
        const response = await axios.get('https://panamaloteria.com/');
        const $ = cheerio.load(response.data);

        const results = [];

        $('.panel.panel-primary').each((i, el) => {
            const header = $(el).find('.panel-heading h2').text().trim();
            // Header usually contains name and date: "Sorteo Miercolito Miércoles 7 de Enero de 2026"

            const table = $(el).find('.plr-md table');
            const data = {};
            table.find('tr').each((j, tr) => {
                const label = $(tr).find('td').eq(0).text().trim();
                const value = $(tr).find('td').eq(1).text().trim();
                if (label && value) {
                    data[label] = value;
                }
            });

            if (header && Object.keys(data).length > 0) {
                results.push({ header, data });
            }
        });

        return results;
    } catch (error) {
        console.error('Error scraping Panama:', error);
        return null;
    }
}
