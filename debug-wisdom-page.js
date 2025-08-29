const { chromium } = require('playwright');

async function debugWisdomPage() {
  // Launch browser in headless mode
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the wisdom page
    console.log('Navigating to wisdom page...');
    await page.goto('http://localhost:3000/wisdom');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'wisdom-page-debug.png', 
      fullPage: true 
    });
    
    // Get page title to confirm we're on the right page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Wait a bit to ensure everything is rendered
    console.log('Wisdom page loaded. Screenshot saved as wisdom-page-debug.png');
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugWisdomPage();