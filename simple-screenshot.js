const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('Going to wisdom page...');
    await page.goto('http://localhost:3000/wisdom', { waitUntil: 'networkidle' });
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'wisdom-page.png', fullPage: true });
    
    console.log('Screenshot saved as wisdom-page.png');
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback: try without custom executable path
    try {
      if (browser) await browser.close();
      
      console.log('Trying fallback approach...');
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });
      
      await page.goto('http://localhost:3000/wisdom', { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'wisdom-page.png', fullPage: true });
      
      console.log('Screenshot saved as wisdom-page.png (fallback)');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();