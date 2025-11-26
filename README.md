# Feibot Race Results Scraper

A Node.js web scraper that extracts race results from Feibot timing system by bib number.

## Features

- Scrapes race data by entering bib numbers sequentially
- Exports results to CSV format
- Configurable bib number range
- Respectful scraping with delays between requests
- Headless browser automation using Puppeteer

## Installation

```bash
npm install
```

## Configuration

Edit the `CONFIG` object in `scraper.js`:

```javascript
const CONFIG = {
  url: 'https://time.feibot.com/live-wire/race-page/2643/m1M28bl8ly',
  startBib: 1,
  endBib: 100,        // Change this to your desired maximum bib number
  outputFile: 'race_results.csv',
  delayBetweenRequests: 1000, // Delay in milliseconds
};
```

## Usage

```bash
npm start
```

Or directly with Node:

```bash
node scraper.js
```

## Output

The scraper will create a `race_results.csv` file containing:
- Bib number
- Name
- Time
- Rank
- Category
- Gender
- Team

## Notes

- The scraper includes a 1-second delay between requests to be respectful to the server
- You may need to adjust the selectors in the code based on the actual page structure
- The script uses headless Chrome via Puppeteer
- Failed bib numbers (non-existent participants) will be skipped

## Troubleshooting

If the scraper isn't finding data:
1. Run with `headless: false` to see what's happening
2. Check the browser console for errors
3. Adjust the CSS selectors in the `page.evaluate()` function
4. Increase the `waitForTimeout` values if the page loads slowly
