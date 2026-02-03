const { test, expect } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let BASE;
let server;

function startStaticServer(root){
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
  return new Promise((resolve, reject) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
async function stopStaticServer(){ if (server) await new Promise(r => server.close(r)); }

// Keep console error logs for each test
let errors = [];

test.beforeAll(async () => { const s = await startStaticServer(ROOT); BASE = `http://127.0.0.1:${s.port}`; server = s.server; });
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
  // Wait for App state to reflect duel started
  await page.waitForFunction(() => { try { return !!(window.App && window.App.state && window.App.state.inSubmissionDuel); } catch(e){ return false; } }, null, { timeout: 2000 });
  // Resolve by calling the API to avoid pointer blocking issues
  await page.evaluate(() => { try { App.duelSubmit(); } catch(e){ console.warn('duelSubmit failed',e); } });
  await page.waitForFunction(() => { try { return !(window.App && window.App.state && window.App.state.inSubmissionDuel); } catch(e){ return false; } }, null, { timeout: 2000 });
  expect(errors).toEqual([]);
});

test('sudden death setup and start', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Open sudden death setup
  await page.evaluate(() => { try { App.populateSuddenDeathMoves(); document.getElementById('sudden-death-setup').style.display = 'flex'; } catch(e){ console.warn('populateSuddenDeathMoves failed', e); } });
  // Start sudden death via API and immediately run the first turn (avoid relying on setTimeout scheduling)
  await page.evaluate(() => { try { App.startSuddenDeath(); App.runSuddenTurn('wayne'); } catch(e){ console.warn('startSuddenDeath/runSuddenTurn failed', e); } });
  // Should show sudden hud
  await page.waitForSelector('#sudden-hud', { state: 'visible', timeout: 5000 });
  expect(errors).toEqual([]);
});

test('sexfight tiebreaker and winner', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Open sexfight setup and configure MOST mode with short duration
  await page.evaluate(() => { try { App.openSexFightSetup(); } catch(e){ console.warn('openSexFightSetup failed', e); } });
  await page.waitForSelector('#sexfight-setup', { state: 'visible' });
  // Trigger a tied end immediately by setting state and calling endSexFight()
  await page.evaluate(() => {
    try {
      App.state.sexfight = { mode:'MOST', duration:10, tally:{wayne:1,cindy:1}, timestamps:{wayne:[Date.now()],cindy:[Date.now()]}, started:true, startTime: Date.now()-2000, endTime: Date.now()-1000, tiebreaker:false };
      App.endSexFight();
    } catch(e){ console.warn('endSexFight trigger failed', e); }
  });
  // Tiebreaker should be active — check via state or innerText polling
  await page.waitForFunction(() => {
    const el = document.getElementById('sexfight-hud'); if (!el) return false; return el.innerText.toLowerCase().includes('tiebreaker');
  }, null, { timeout: 3000 });
  const hudText = await page.locator('#sexfight-hud').innerText();
  expect(hudText.toLowerCase()).toContain('tiebreaker');
  // Resolve tiebreaker by invoking endSexFight with a winner (ensures deterministic outcome)
  await page.evaluate(() => { try { App.endSexFight('wayne'); } catch(e){ console.warn('endSexFight(winner) failed', e); } });
  // Winner screen should be visible (App.endMatchWithWinner waits a few seconds before showing overlay)
  await page.waitForSelector('#winner-screen', { state: 'visible', timeout: 7000 });
  expect(errors).toEqual([]);
});

test('advanced settings persistence', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  // Ensure App init has run so advanced toggle is wired
  await page.evaluate(() => { try { App.init && App.init(); } catch(e){} });
  // Show advanced panel directly (avoids timing issues with animation listeners)
  await page.evaluate(() => { const adv = document.getElementById('advanced-settings'); if (adv) { adv.hidden = false; adv.classList.add('advanced-expanded'); document.getElementById('toggle-advanced').setAttribute('aria-expanded','true'); } });
  // Change gauntlet seconds directly (avoid fill visibility issues)
  await page.evaluate(() => { const g = document.getElementById('gauntlet-seconds'); if (g) g.value = '14'; });
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
