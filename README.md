# Feibot Race Results Scraper

A Node.js web scraper that extracts race results from Feibot timing system by bib number.

## Features

- Scrapes race data by querying bib numbers sequentially via API
- Automatic CSRF token handling for authenticated requests
- Streams results directly to CSV (memory efficient)
- Configurable bib number range
- Respectful scraping with delays between requests
- Lightweight implementation using axios and cheerio (no browser required)

## Installation

```bash
npm install
```

## Configuration

Edit the `CONFIG` object in `scraper.js`:

```javascript
const CONFIG = {
  apiUrl: 'https://time.feibot.com/live-wire/scores/query',
  raceId: '2643',
  startBib: 1,
  endBib: 5000,       // Change this to your desired maximum bib number
  outputFile: 'race_results.csv',
  delayBetweenRequests: 500, // Delay in milliseconds
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
- BIB - Bib number
- NAME - Participant name
- AGEGROUP - Age group category
- GENDER - Gender
- EVENT - Event name
- STATUS - Finish status
- GUNTIME - Gun time
- NETTIME - Net/chip time
- OVERALLGUNRANK - Overall gun time rank
- OVERALLCHIPRANK - Overall chip time rank
- GENDERGUNRANK - Gender gun time rank
- GENDERCHIPRANK - Gender chip time rank
- AGEGROUPGUNRANK - Age group gun time rank
- AGEGROUPCHIPRANK - Age group chip time rank
- FINISHPACE - Finish pace

## How It Works

1. Fetches the race page to obtain a CSRF token and session cookies
2. For each bib number, sends a POST request to the scores query API
3. Parses the HTML response using cheerio to extract race data
4. Streams each result directly to the CSV file (no memory buildup)
5. Includes a configurable delay between requests

## Additional Scripts

- `test-api.js` - Uses Playwright to investigate API endpoints and network requests
- `debug-response.js` - Debug utility to inspect HTML response structure for a single bib

## Notes

- The scraper includes a 500ms delay between requests to be respectful to the server
- Results are streamed to CSV as they are fetched (memory efficient for large ranges)
- Failed bib numbers (non-existent participants) are skipped with a log message
- No browser required - uses direct HTTP requests

## Troubleshooting

If the scraper isn't finding data:
1. Check if the CSRF token is being obtained successfully
2. Verify the `raceId` matches your target race
3. Run `debug-response.js` to inspect the HTML structure
4. Check if the response selectors match the current page structure
