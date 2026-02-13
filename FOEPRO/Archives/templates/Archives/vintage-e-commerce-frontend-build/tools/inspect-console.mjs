import puppeteer from 'puppeteer';

(async ()=>{
  try{
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGEERROR', err && err.stack || err));
    page.on('requestfailed', req => console.log('REQUESTFAILED', req.url(), req.failure()));

    await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('Done');
    await browser.close();
  }catch(e){
    console.error('PUPPETEER ERROR', e && e.stack || e);
    process.exit(1);
  }
})();
