# Lottery Scraper

Automated lottery results scraper for Central American and Caribbean lotteries.

## Supported Lotteries

- 🇭🇳 **Honduras** - DIARIA & PREMIA2 (3 daily draws)
- 🇳🇮 **Nicaragua** - Suerte Nica (4 daily draws)
- 🇨🇷 **Costa Rica** - Monazo & Tica (3 daily draws)
- 🇩🇴 **Dominican Republic** - La Primera (multiple daily draws)
- 🇺🇸 **USA** - New York & Florida (with DST support)
- 🇵🇦 **Panama** - Lotería Nacional (Wed & Sun)

## Features

- ✅ All times converted to Panama timezone (UTC-5)
- ✅ Automatic DST handling for USA lotteries
- ✅ `draw_date` field for easy matching
- ✅ Automatic cleanup of old results after midnight
- ✅ Scheduled execution via GitHub Actions

## Schedule

Results are scraped automatically at the following times (Panama timezone):

- 11:05 AM - Dominican Republic (La Primera)
- 12:05 PM - Honduras
- 1:05 PM - Nicaragua
- 2:00 PM - Costa Rica (Mediodía)
- 2:35 PM - USA (New York Midday)
- 3:05 PM - Panama (Wed/Sun only)
- 4:05 PM - Nicaragua & Honduras
- 5:35 PM - Costa Rica (Tarde)
- 6:05 PM - Dominican Republic
- 7:05 PM - Nicaragua
- 8:35 PM - Costa Rica (Tica)
- 9:50 PM - USA (Florida)
- 10:05 PM - Nicaragua & Honduras
- 10:35 PM - USA (New York Evening)

## Database Structure

Results are saved to Supabase with the following structure:

```json
{
  "country": "Honduras",
  "draw_name": "Honduras",
  "draw_date": "2026-01-11",
  "data": [
    {
      "time": "12:00 PM",
      "prizes": ["47", "78", "21"]
    }
  ],
  "scraped_at": "2026-01-11T12:05:00-05:00"
}
```

## Manual Execution

To run the scraper manually:

1. Go to [Actions](https://github.com/yau1yuny-ctrl/lotto-parser/actions/workflows/scrape.yml)
2. Click "Run workflow"
3. Select "main" branch
4. Click "Run workflow"

## License

ISC
