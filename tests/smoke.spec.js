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

test.describe('smoke', () => {
  test.beforeAll(async () => { const s = await startStaticServer(ROOT); BASE = `http://127.0.0.1:${s.port}`; server = s.server; });
  test.afterAll(async () => { await stopStaticServer(); });

  test('basic smoke: load app, start match, start sexfight, no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('#start-screen .btn-menu:not([disabled])', { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/start-screen.png' });

    // Click START MATCH
    await page.click('#start-screen .btn-menu');
    // Wait for start-screen to hide and controls to appear
    await page.waitForSelector('#start-screen', { state: 'hidden', timeout: 10000 });
    await page.waitForSelector('#controls-area', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: 'tests/screenshots/after-start.png' });

    // Open Sexfight setup via App helper
    await page.evaluate(() => { try { App.openSexFightSetup(); } catch(e){ console.warn('openSexFightSetup failed',e)} });
    await page.waitForSelector('#sexfight-setup', { state: 'visible', timeout: 5000 });
    await page.screenshot({ path: 'tests/screenshots/sexfight-setup.png' });

    // Set duration to 15 and start
    await page.fill('#sexfight-duration', '15');
  // Use App API directly to avoid overlay click interception flakiness
  await page.evaluate(() => { try { App.startSexFight(); } catch(e){ console.warn('startSexFight failed', e); } });
    // HUD should appear
    await page.waitForSelector('#sexfight-hud', { state: 'visible', timeout: 5000 });
    await page.screenshot({ path: 'tests/screenshots/sexfight-hud.png' });

    // Let the sexfight run for a short moment, then check no console errors
    await page.waitForTimeout(2000);

    // Assert no console errors were captured
    expect(errors).toEqual([]);
  });
});

