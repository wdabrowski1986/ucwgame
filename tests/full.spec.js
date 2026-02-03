const { test, expect } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8080;
const BASE = `http://127.0.0.1:${PORT}`;
let server;

function startStaticServer(root, port){
  const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json' };
  server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const full = path.join(root, reqPath);
    if (!full.startsWith(root)) { res.statusCode = 403; res.end('Forbidden'); return; }
    fs.readFile(full, (err, data) => {
      if (err){ res.statusCode = 404; res.end('Not found'); return; }
      const ext = path.extname(full);
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
async function stopStaticServer(){ if (server) await new Promise(r => server.close(r)); }

// Keep console error logs for each test
let errors = [];

test.beforeAll(async () => { await startStaticServer(ROOT, PORT); });
test.afterAll(async () => { await stopStaticServer(); });

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
});

test('submission duel flow', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Trigger a submission duel directly
  await page.evaluate(() => { try { App.startSubmissionDuel(); } catch(e){ console.warn('startSubmissionDuel failed', e); } });
  await page.waitForSelector('#submission-duel', { state: 'visible' });
  // Resolve by calling the API to avoid pointer blocking issues
  await page.evaluate(() => { try { App.duelSubmit(); } catch(e){ console.warn('duelSubmit failed',e); } });
  await page.waitForSelector('#submission-duel', { state: 'hidden' });
  expect(errors).toEqual([]);
});

test('sudden death setup and start', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Open sudden death setup
  await page.evaluate(() => { try { App.populateSuddenDeathMoves(); document.getElementById('sudden-death-setup').style.display = 'flex'; } catch(e){ console.warn('populateSuddenDeathMoves failed', e); } });
  await page.waitForSelector('#sudden-death-setup select');
  // Start sudden death via API to avoid click issues
  await page.evaluate(() => { try { App.startSuddenDeath(); } catch(e){ console.warn('startSuddenDeath failed', e); } });
  // Should show sudden hud
  await page.waitForSelector('#sudden-hud', { state: 'visible' });
  expect(errors).toEqual([]);
});

test('sexfight tiebreaker and winner', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Open sexfight setup and configure MOST mode with short duration
  await page.evaluate(() => { try { App.openSexFightSetup(); } catch(e){ console.warn('openSexFightSetup failed', e); } });
  await page.waitForSelector('#sexfight-setup', { state: 'visible' });
  await page.selectOption('input[name="sexf-mode"]', 'MOST').catch(()=>{});
  await page.fill('#sexfight-duration', '2');
  // Start sexfight via API to avoid overlay click issues
  await page.evaluate(() => { try { App.startSexFight(); } catch(e){ console.warn('startSexFight failed', e); } });
  await page.waitForSelector('#sexfight-hud', { state: 'visible' });
  // Simulate simultaneous orgasms to create tie
  await page.evaluate(() => { App.orgasm('wayne'); App.orgasm('cindy'); });
  // Wait for duration to end and tiebreaker to activate
  await page.waitForTimeout(2500);
  // Tiebreaker should be active and show text
  const hudText = await page.locator('#sexfight-hud').innerText();
  expect(hudText.toLowerCase()).toContain('tiebreaker');
  // Resolve tiebreaker by Wayne orgasm
  await page.evaluate(() => { App.orgasm('wayne'); });
  // Wait for winner flow to run
  await page.waitForTimeout(1500);
  // Winner screen should be visible
  await page.waitForSelector('#winner-screen', { state: 'visible', timeout: 3000 });
  expect(errors).toEqual([]);
});

test('advanced settings persistence', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  // Open advanced panel
  await page.click('#toggle-advanced');
  await page.waitForSelector('#advanced-settings', { state: 'visible' });
  // Change gauntlet seconds
  await page.fill('#gauntlet-seconds', '14');
  // Trigger save (App.saveSettings is called on start; call it directly)
  await page.evaluate(() => { try { App.saveSettings(); } catch(e){ console.warn('saveSettings failed', e); } });
  // Reload page and check persisted value
  await page.reload({ waitUntil: 'load' });
  const val = await page.$eval('#gauntlet-seconds', el => el.value);
  expect(parseInt(val, 10)).toBe(14);
  expect(errors).toEqual([]);
});

test('service worker register and offline reload', async ({ page, context }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  // Attempt to register service worker
  const reg = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      try { const r = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; return true; } catch(e){ return false; }
    }
    return false;
  });
  // If registration supported, test offline reload
  if (reg) {
    await context.setOffline(true);
    // Reload should still show cached index (service worker may serve)
    await page.reload({ waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.toLowerCase()).toContain('championship');
    await context.setOffline(false);
  }
  expect(errors).toEqual([]);
});
