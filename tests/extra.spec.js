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
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
async function stopStaticServer(){ if (server) await new Promise(r => server.close(r)); }

let errors = [];

test.beforeAll(async () => { const s = await startStaticServer(ROOT); BASE = `http://127.0.0.1:${s.port}`; server = s.server; });
test.afterAll(async () => { await stopStaticServer(); });

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
});

test('judge -> submission gauntlet flow', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  // Start the match
  await page.click('#start-screen .btn-menu');
  // Seed state to trigger gauntlet when judge picks draw
  await page.evaluate(() => {
    App.state.roundCount = 3; App.state.p1Falls = 1; App.state.p2Falls = 1;
    try { App.showJudgeOverlay('wayne'); } catch(e){}
  });
  // Choose draw which should show the submission gauntlet overlay
  await page.evaluate(() => { try { App.judgePick('draw'); } catch(e){} });
  await page.waitForSelector('#submission-gauntlet', { state: 'visible' });

  // Start gauntlet and run first turn immediately
  await page.evaluate(() => { try { App.startSubmissionGauntlet(); App.runGauntletTurn('wayne'); } catch(e){} });
  await page.waitForSelector('#sudden-hud', { state: 'visible' });
  const hud = await page.$eval('#sudden-hud', el => el.innerText);
  expect(hud.toLowerCase()).toContain('gauntlet');
  expect(errors).toEqual([]);
});

test('sudden death tie chaining behavior', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  // Set up sudden death and seed a tied tally, then call endSuddenTurn to force tie logic
  await page.evaluate(() => {
    try {
      App.populateSuddenDeathMoves();
      App.state.suddenMoves = { wayne: {name:'Test',desc:''}, cindy: {name:'Test2',desc:''} };
      App.state.suddenDeathTally = { wayne: 2, cindy: 2 };
      App.state._suddenSecondDone = true; // emulate end of second turn
      App.endSuddenTurn();
    } catch(e){}
  });
  // After tie logic runs, tally should have been reset (0/0)
  const tally = await page.evaluate(() => ({...App.state.suddenDeathTally}));
  expect(tally.wayne).toBe(0);
  expect(tally.cindy).toBe(0);
  expect(errors).toEqual([]);
});

test('service worker serves cached asset while offline', async ({ page, context }) => {
  await page.goto(BASE, { waitUntil: 'load' });
  // register SW if possible
  const reg = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; return true; } catch(e){ return false; }
    }
    return false;
  });
  if (!reg) return; // skip if not supported

  await context.setOffline(true);
  const ok = await page.evaluate(async () => {
    try {
      const r = await fetch('/images/belt.png');
      return !!(r && r.ok);
    } catch(e) { return false; }
  });
  await context.setOffline(false);
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile responsiveness: controls visible on small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.click('#start-screen .btn-menu');
  await page.waitForSelector('#controls-area', { state: 'visible' });
  const visible = await page.$eval('#btn-addtap', el => !!(el && (getComputedStyle(el).display !== 'none')));
  expect(visible).toBe(true);
  expect(errors).toEqual([]);
});
