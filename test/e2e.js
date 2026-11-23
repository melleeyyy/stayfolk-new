/**
 * StayFolk — end-to-end smoke test.
 * Serves the static build, drives it in headless Chromium and exercises the
 * real user journeys: browsing, filtering, signup, request, accept, message,
 * language switch and the moderation console.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, BASE);
  let rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(ROOT, rel);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));

  const go = async (hash) => {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await new Promise((r) => setTimeout(r, 220));
  };
  const text = () => page.evaluate(() => document.querySelector('#main').innerText);

  /* --- 1. routes render --- */
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));

  const routes = [
    ['#/', 'Travel like a'], ['#/explore', 'hosts available'], ['#/cities', 'Kochi'],
    ['#/city/kochi', 'Kochi'], ['#/host/h1', 'Ananya Menon'], ['#/how', 'How StayFolk works'],
    ['#/safety', 'Safety centre'], ['#/form-c', 'Form C'], ['#/login', 'Welcome back'], ['#/signup', 'Join StayFolk'],
    ['#/dashboard', 'Welcome back'], ['#/admin', 'Welcome back'], ['#/messages', 'Welcome back'],
  ];
  for (const [hash, needle] of routes) {
    await go(hash);
    const body = await text();
    check(`route ${hash}`, body.includes(needle), body.slice(0, 40).replace(/\n/g, ' '));
  }

  /* --- 1b. icon sizing regression guard --- */
  await go('#/');
  const hugeIcons = await page.evaluate(() =>
    [...document.querySelectorAll('svg.icon')]
      .map((s) => s.getBoundingClientRect())
      .filter((r) => r.width > 48 || r.height > 48).length);
  check('no oversized icons', hugeIcons === 0, `${hugeIcons} oversized`);

  /* --- 1c. Form C checklist --- */
  await go('#/form-c');
  const beforePct = await page.evaluate(() => document.querySelector('.progress__bar').style.width);
  await page.click('input[data-formc="step1"]');
  await new Promise((r) => setTimeout(r, 350));
  const afterPct = await page.evaluate(() => document.querySelector('.progress__bar').style.width);
  check('Form C progress advances', afterPct !== beforePct, `${beforePct} → ${afterPct}`);

  /* --- 2. language switching --- */
  await go('#/');
  const langSwitch = async (code, needle, dir = 'ltr') => {
    await page.select('#lang-select', code);
    await new Promise((r) => setTimeout(r, 300));
    const body = await text();
    const html = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }));
    check(`locale ${code}`, body.includes(needle) && html.lang === code && html.dir === dir, body.slice(0, 30).replace(/\n/g, ' '));
  };
  await langSwitch('ml', 'പ്രദേശവാസി');
  await langSwitch('hi', 'स्थानीय');
  await langSwitch('ar', 'محلي', 'rtl');
  await langSwitch('ja', '地元の人');
  await langSwitch('ta', 'உள்ளூர்வாசி');
  await langSwitch('en', 'Travel like a');

  /* --- 3. filters --- */
  await go('#/explore');
  const before = await page.$$eval('.host-card', (els) => els.length);
  await page.type('#f-city', 'Lisbon');
  await page.$eval('#f-city', (el) => el.blur());
  await new Promise((r) => setTimeout(r, 500));
  const after = await page.$$eval('.host-card', (els) => els.length);
  check('filter by city narrows results', after > 0 && after < before, `${before} → ${after}`);

  await go('#/explore');
  await page.click('input[name="women"]');
  await new Promise((r) => setTimeout(r, 500));
  const womenBadges = await page.$$eval('.host-card .badge', (els) =>
    els.filter((e) => e.textContent.includes('Women only')).length);
  const womenCount = await page.$$eval('.host-card', (els) => els.length);
  check('women-only filter applies', womenCount > 0 && womenCount < before && womenBadges >= womenCount, `${womenCount} hosts`);

  /* --- 4. login as host --- */
  await go('#/login');
  await page.type('#a-email', 'host@stayfolk.demo');
  await page.type('#a-pass', 'demo1234');
  await page.click('#auth-form button[type="submit"]');
  await new Promise((r) => setTimeout(r, 500));
  const dashText = await text();
  check('host login → dashboard', dashText.includes('Ananya Menon') && dashText.includes('Incoming requests'), dashText.slice(0, 40).replace(/\n/g, ' '));

  /* --- 5. accept a request --- */
  const pendingBefore = await page.$$eval('.request-item', (els) => els.length);
  await page.click('[data-action="respond"][data-status="accepted"]');
  await new Promise((r) => setTimeout(r, 400));
  const acceptedCount = await page.$$eval('.badge--accepted', (els) => els.length);
  check('accept request', acceptedCount >= 2, `${pendingBefore} requests, ${acceptedCount} accepted`);

  /* --- 6. messaging --- */
  await go('#/messages');
  const threadCount = await page.$$eval('.thread-item', (els) => els.length);
  check('messages list renders threads', threadCount > 0, `${threadCount} threads`);
  if (threadCount) {
    await page.type('#msg-form input[name="text"]', 'See you on Saturday!');
    await page.click('#msg-form button[type="submit"]');
    await new Promise((r) => setTimeout(r, 400));
    const bubbles = await page.$$eval('.bubble', (els) => els.map((e) => e.textContent));
    check('send message', bubbles.some((b) => b.includes('See you on Saturday')), `${bubbles.length} bubbles`);
  }

  /* --- 7. request flow as guest --- */
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  await page.type('#a-email', 'guest@stayfolk.demo');
  await page.type('#a-pass', 'demo1234');
  await page.click('#auth-form button[type="submit"]');
  await new Promise((r) => setTimeout(r, 400));

  await go('#/host/h4');
  await page.click('[data-action="open-request"]');
  await new Promise((r) => setTimeout(r, 300));
  const modalOpen = await page.$('.modal') !== null;
  check('request modal opens', modalOpen);
  if (modalOpen) {
    await page.type('#r-msg', 'Hello Diogo, I would love to surf with you next week.');
    await page.click('#request-form button[type="submit"]');
    await new Promise((r) => setTimeout(r, 400));
    const toastText = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.toast')];
      return all.length ? all[all.length - 1].innerText : '';
    });
    check('request sent', toastText.includes('Request sent'), toastText);

    await go('#/dashboard');
    const outgoing = await text();
    check('request appears in guest dashboard', outgoing.includes('Diogo Ferreira'), outgoing.slice(0, 60).replace(/\n/g, ' '));
  }

  /* --- 8. admin console --- */
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  await page.type('#a-email', 'admin@stayfolk.demo');
  await page.type('#a-pass', 'demo1234');
  await page.click('#auth-form button[type="submit"]');
  await new Promise((r) => setTimeout(r, 500));
  const adminText = await text();
  const reportRows = await page.$$eval('.admin-table tbody tr', (els) => els.length);
  check('admin login → console', adminText.includes('Moderation console') && reportRows > 0, `${reportRows} rows`);
  await page.click('[data-action="resolve-report"]');
  await new Promise((r) => setTimeout(r, 400));
  const rowsAfter = await page.$$eval('.admin-table tbody tr', (els) => els.length);
  check('resolve report removes it from queue', rowsAfter < reportRows, `${reportRows} → ${rowsAfter}`);

  /* --- 8b. photo upload --- */
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  await page.type('#a-email', 'host@stayfolk.demo');
  await page.type('#a-pass', 'demo1234');
  await page.click('#auth-form button[type="submit"]');
  await new Promise((r) => setTimeout(r, 400));
  await go('#/dashboard/profile');
  const fileInput = await page.$('input[type="file"][data-photo="avatar"]');
  if (fileInput) {
    await fileInput.uploadFile(path.join(__dirname, 'upload-sample.png'));
    await new Promise((r) => setTimeout(r, 900));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('stayfolk.v1')).photos);
    check('photo upload persists', Boolean(stored && stored.h1 && stored.h1.avatar), JSON.stringify(Object.keys(stored || {})));
    await go('#/host/h1');
    const usesPhoto = await page.evaluate(() => {
      const img = document.querySelector('.profile-head img.avatar');
      return img && img.getAttribute('src').startsWith('data:image');
    });
    check('uploaded avatar shown on profile', usesPhoto === true);
  } else {
    check('photo upload persists', false, 'file input not found');
  }

  /* --- 9. dark theme + screenshots --- */
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'shot-home.png') });
  await go('#/host/h1');
  await page.screenshot({ path: path.join(__dirname, 'shot-host.png') });
  await go('#/explore');
  await page.screenshot({ path: path.join(__dirname, 'shot-explore.png') });

  await page.click('[data-action="toggle-theme"]');
  await new Promise((r) => setTimeout(r, 300));
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  check('dark theme toggles', theme === 'dark');

  /* --- 10. mobile layout --- */
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await go('#/');
  await new Promise((r) => setTimeout(r, 400));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('no horizontal overflow on mobile', overflow <= 1, `overflow ${overflow}px`);
  await page.screenshot({ path: path.join(__dirname, 'shot-mobile.png') });

  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('TEST CRASHED:', e);
  process.exit(1);
});
