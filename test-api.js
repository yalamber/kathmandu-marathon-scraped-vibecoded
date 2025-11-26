const { chromium } = require('playwright');

async function investigateAPI() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData()
    });
  });

  const responses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api') || url.includes('search') || url.includes('bib') || url.includes('result')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const body = await response.text();
          responses.push({
            url,
            status: response.status(),
            body: body.substring(0, 500) // First 500 chars
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  });

  console.log('Navigating to page...');
  await page.goto('https://time.feibot.com/live-wire/race-page/2643/m1M28bl8ly', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  console.log('\nEntering bib number 1...');
  const bibInput = page.locator('#bib');
  await bibInput.fill('1');
  await bibInput.press('Enter');

  await page.waitForTimeout(3000);

  console.log('\n=== Network Requests ===');
  requests.forEach((req, i) => {
    if (req.url.includes('feibot') && !req.url.includes('.css') && !req.url.includes('.js') && !req.url.includes('.png')) {
      console.log(`\n[${i}] ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`    POST Data: ${req.postData}`);
      }
    }
  });

  console.log('\n=== API Responses ===');
  responses.forEach((res, i) => {
    console.log(`\n[${i}] ${res.url}`);
    console.log(`    Status: ${res.status}`);
    console.log(`    Body: ${res.body}`);
  });

  await browser.close();
}

investigateAPI().catch(console.error);
