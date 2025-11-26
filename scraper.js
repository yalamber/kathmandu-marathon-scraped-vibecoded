const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Configuration
const CONFIG = {
  apiUrl: 'https://time.feibot.com/live-wire/scores/query',
  raceId: '2643',
  startBib: 1,
  endBib: 5000, // Change this to your desired maximum bib number
  outputFile: 'race_results.csv',
  delayBetweenRequests: 500, // 500ms delay between requests
};

// CSV headers
const CSV_HEADERS = 'BIB,NAME,AGEGROUP,GENDER,EVENT,STATUS,GUNTIME,NETTIME,OVERALLGUNRANK,OVERALLCHIPRANK,GENDERGUNRANK,GENDERCHIPRANK,AGEGROUPGUNRANK,AGEGROUPCHIPRANK,FINISHPACE\n';

// Function to escape CSV values
function escapeCSV(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Function to write a single row to CSV
function writeRowToCSV(data) {
  const row = [
    data.bib,
    escapeCSV(data.name),
    escapeCSV(data.ageGroup),
    escapeCSV(data.gender),
    escapeCSV(data.event),
    escapeCSV(data.status),
    escapeCSV(data.gunTime),
    escapeCSV(data.netTime),
    escapeCSV(data.overallGunRank),
    escapeCSV(data.overallChipRank),
    escapeCSV(data.genderGunRank),
    escapeCSV(data.genderChipRank),
    escapeCSV(data.ageGroupGunRank),
    escapeCSV(data.ageGroupChipRank),
    escapeCSV(data.finishPace)
  ].join(',') + '\n';

  fs.appendFileSync(CONFIG.outputFile, row);
}

// First, we need to get a valid CSRF token
async function getCSRFToken() {
  try {
    const response = await axios.get(`https://time.feibot.com/live-wire/race-page/${CONFIG.raceId}/m1M28bl8ly`);
    const $ = cheerio.load(response.data);
    const token = $('input[name="_token"]').val();

    // Extract cookies from response
    const cookies = response.headers['set-cookie'];

    return { token, cookies };
  } catch (error) {
    console.error('Error getting CSRF token:', error.message);
    return null;
  }
}

async function scrapeRaceData() {
  console.log('Getting CSRF token...');
  const auth = await getCSRFToken();

  if (!auth || !auth.token) {
    console.error('Failed to get CSRF token');
    return 0;
  }

  console.log('Token obtained successfully');

  // Initialize CSV file with headers
  if (fs.existsSync(CONFIG.outputFile)) {
    fs.unlinkSync(CONFIG.outputFile);
  }
  fs.writeFileSync(CONFIG.outputFile, CSV_HEADERS);

  let recordCount = 0;
  const cookieString = auth.cookies ? auth.cookies.map(c => c.split(';')[0]).join('; ') : '';

  console.log(`Scraping bib numbers from ${CONFIG.startBib} to ${CONFIG.endBib}`);
  console.log(`Streaming results to ${CONFIG.outputFile}\n`);

  for (let bibNumber = CONFIG.startBib; bibNumber <= CONFIG.endBib; bibNumber++) {
    try {
      console.log(`Processing bib number: ${bibNumber}`);

      const formData = new URLSearchParams({
        '_token': auth.token,
        'bib': bibNumber.toString(),
        'race_id': CONFIG.raceId
      });

      const response = await axios.post(CONFIG.apiUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieString,
          'Referer': `https://time.feibot.com/live-wire/race-page/${CONFIG.raceId}/m1M28bl8ly`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });

      // Parse the HTML response
      const $ = cheerio.load(response.data);

      // Extract data using the actual HTML structure
      const resultData = {
        bib: bibNumber,
        name: '',
        ageGroup: '',
        gender: '',
        event: '',
        status: '',
        gunTime: '',
        netTime: '',
        overallGunRank: '',
        overallChipRank: '',
        genderGunRank: '',
        genderChipRank: '',
        ageGroupGunRank: '',
        ageGroupChipRank: '',
        finishPace: ''
      };

      // Extract data from rows with structure: .row > .col.fw-bold (label) + .col.text-center (value)
      $('.row').each((i, row) => {
        const label = $(row).find('.col.fw-bold').text().trim();
        const value = $(row).find('.col.text-center').text().trim();

        if (label && value) {
          switch (label) {
            case 'Name':
              resultData.name = value;
              break;
            case 'Age Group':
              resultData.ageGroup = value;
              break;
            case 'Gender':
              resultData.gender = value;
              break;
            case 'Event':
              resultData.event = value;
              break;
            case 'Status':
              resultData.status = value;
              break;
            case 'Gun Time':
              resultData.gunTime = value;
              break;
            case 'Net Time':
              resultData.netTime = value;
              break;
            case 'Overall Gun Time Rank':
              resultData.overallGunRank = value;
              break;
            case 'Overall Chip TIme Rank':
              resultData.overallChipRank = value;
              break;
            case 'Gender Gun Time Rank':
              resultData.genderGunRank = value;
              break;
            case 'Gender Chip TIme Rank':
              resultData.genderChipRank = value;
              break;
            case 'Age Group Gun Time Rank':
              resultData.ageGroupGunRank = value;
              break;
            case 'Age Group Chip Time Rank':
              resultData.ageGroupChipRank = value;
              break;
          }
        }
      });

      // Extract finish pace from the splits table
      $('.d-flex.justify-content-evenly').each((i, row) => {
        const cells = $(row).find('.col.text-center').map((j, cell) => $(cell).text().trim()).get();
        if (cells[0] && cells[0].includes('Finish') && cells[2]) {
          resultData.finishPace = cells[2];
        }
      });

      // Check if we actually found data
      const hasData = resultData.name || resultData.gunTime || resultData.overallGunRank;

      if (hasData) {
        writeRowToCSV(resultData);
        recordCount++;
        console.log(`  ✓ Found: ${resultData.name || 'Unknown'} - ${resultData.gunTime || 'N/A'} (Rank: ${resultData.overallGunRank || 'N/A'}) [Total: ${recordCount}]`);
      } else {
        console.log(`  ✗ No data found for bib ${bibNumber}`);
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));

    } catch (error) {
      console.log(`  ✗ Error processing bib ${bibNumber}: ${error.message}`);
    }
  }

  return recordCount;
}

// Main execution
(async () => {
  console.log('='.repeat(50));
  console.log('Feibot Race Results Scraper');
  console.log('='.repeat(50));

  const recordCount = await scrapeRaceData();

  console.log('='.repeat(50));
  console.log('Scraping completed!');
  console.log(`✓ Total records collected: ${recordCount}`);
  console.log(`✓ Data saved to ${CONFIG.outputFile}`);
  console.log('='.repeat(50));
})();
