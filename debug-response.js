const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function getCSRFToken() {
  const response = await axios.get('https://time.feibot.com/live-wire/race-page/2643/m1M28bl8ly');
  const $ = cheerio.load(response.data);
  const token = $('input[name="_token"]').val();
  const cookies = response.headers['set-cookie'];
  return { token, cookies };
}

async function debugBib(bibNumber) {
  const auth = await getCSRFToken();
  const cookieString = auth.cookies ? auth.cookies.map(c => c.split(';')[0]).join('; ') : '';

  const formData = new URLSearchParams({
    '_token': auth.token,
    'bib': bibNumber.toString(),
    'race_id': '2643'
  });

  const response = await axios.post('https://time.feibot.com/live-wire/scores/query', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString,
      'Referer': 'https://time.feibot.com/live-wire/race-page/2643/m1M28bl8ly',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    maxRedirects: 0,
    validateStatus: (status) => status < 400
  });

  // Save the HTML response to a file
  fs.writeFileSync('debug_response.html', response.data);
  console.log('HTML response saved to debug_response.html');

  // Parse and print structure
  const $ = cheerio.load(response.data);

  console.log('\n=== All text content ===');
  console.log($('body').text().replace(/\s+/g, ' ').substring(0, 1000));

  console.log('\n=== Divs with classes ===');
  $('div[class]').each((i, elem) => {
    const className = $(elem).attr('class');
    const text = $(elem).text().trim().substring(0, 100);
    if (text && !text.includes('livewireautofill')) {
      console.log(`${className}: ${text}`);
    }
  });

  console.log('\n=== Tables ===');
  $('table').each((i, table) => {
    console.log(`\nTable ${i}:`);
    $(table).find('tr').each((j, row) => {
      const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
      if (cells.length > 0 && cells.some(c => c.length > 0)) {
        console.log(`  Row ${j}: ${cells.join(' | ')}`);
      }
    });
  });
}

debugBib(1).catch(console.error);
