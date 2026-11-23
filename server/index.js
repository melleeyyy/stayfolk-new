/**
 * StayFolk — application server.
 *
 * A real, self-contained Node server with no dependencies: accounts, sessions,
 * profiles, photo uploads, stay requests and two-way messaging, all persisted
 * to data/db.json. Run it with `node server/index.js` and the whole site works
 * for real people on different devices.
 *
 * Design notes
 *  - zero dependencies, so it runs anywhere Node 20 runs
 *  - scrypt password hashing, httpOnly cookie sessions
 *  - photos are written to data/uploads and served as static files
 *  - one JSON file holds the database; fine up to a few thousand users
 */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const mailer = require('./mailer.js');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT) || 8787;
const COOKIE = 'sf_sid';
const PUBLIC_URL = () => (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/* ------------------------------------------------------------------ store */

const emptyDB = () => ({
  users: [],
  sessions: {},
  requests: [],
  threads: [],
  messages: [],
  reviews: [],
  reports: [],
});

let db = emptyDB();

function ensureDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function loadDB() {
  ensureDirs();
  try {
    if (fs.existsSync(DB_FILE)) {
      db = { ...emptyDB(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
    }
  } catch (err) {
    console.error('[stayfolk] db.json unreadable, starting fresh:', err.message);
    db = emptyDB();
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db));
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('[stayfolk] save failed:', err.message);
    }
  }, 60);
}

const uid = (p) => `${p}_${crypto.randomBytes(8).toString('hex')}`;
const now = () => new Date().toISOString();

/* --------------------------------------------------------------- seed data */

let SEED = { HOSTS: [], CITIES: [] };

async function loadSeed() {
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'assets', 'js', 'data.js')).href);
    SEED = { HOSTS: mod.HOSTS || [], CITIES: mod.CITIES || [] };
    console.log(`[stayfolk] ${SEED.HOSTS.length} seed hosts loaded`);
  } catch (err) {
    console.warn('[stayfolk] seed hosts unavailable:', err.message);
  }
}

const cityOf = (slug) => SEED.CITIES.find((c) => c.slug === slug) || null;

/** Normalise a seed host into the shape the API returns. */
function seedHost(h) {
  const city = cityOf(h.citySlug);
  return {
    id: h.id,
    name: h.name,
    citySlug: h.citySlug,
    cityName: city ? city.name : '',
    country: city ? city.country : '',
    verified: h.verified,
    womenOnly: h.womenOnly,
    rating: h.rating,
    reviewCount: h.reviewCount,
    responseRate: h.responseRate,
    joined: h.joined,
    languages: h.languages,
    maxGuests: h.maxGuests,
    space: h.space,
    tags: h.tags,
    bio: h.bio,
    rules: h.rules,
    avatar: null,
    cover: null,
    isSeed: true,
  };
}

/** A registered member who has switched hosting on. */
function userHost(u) {
  const hosting = u.hosting || {};
  return {
    id: u.id,
    name: u.name,
    citySlug: null,
    cityName: u.city || '',
    country: '',
    verified: Boolean(u.verified),
    womenOnly: Boolean(hosting.womenOnly),
    rating: u.rating || 5,
    reviewCount: db.reviews.filter((r) => r.hostId === u.id).length,
    responseRate: 100,
    joined: (u.createdAt || now()).slice(0, 7),
    languages: u.languages && u.languages.length ? u.languages : ['English'],
    maxGuests: hosting.maxGuests || 1,
    space: hosting.space || 'Spare room',
    tags: hosting.tags || [],
    bio: u.bio || '',
    rules: hosting.rules || [],
    avatar: u.avatar || null,
    cover: u.cover || null,
    isSeed: false,
  };
}

function allHosts() {
  const members = db.users.filter((u) => u.hosting && u.hosting.enabled).map(userHost);
  return [...SEED.HOSTS.map(seedHost), ...members];
}

const findHost = (id) => allHosts().find((h) => h.id === id) || null;

/* ------------------------------------------------------------------- auth */

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  if (Date.now() - session.at > 1000 * 60 * 60 * 24 * 60) {
    delete db.sessions[token];
    return null;
  }
  return db.users.find((u) => u.id === session.userId) || null;
}

function startSession(res, userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId, at: Date.now() };
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 60}${secure}`
  );
  save();
  return token;
}

function endSession(req, res) {
  const token = parseCookies(req)[COOKIE];
  if (token) delete db.sessions[token];
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  save();
}

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  username: u.username || '',
  email: u.email,
  emailVerified: Boolean(u.emailVerified),
  city: u.city || '',
  bio: u.bio || '',
  languages: u.languages || [],
  avatar: u.avatar || null,
  cover: u.cover || null,
  verified: Boolean(u.verified),
  role: u.role || 'member',
  hosting: u.hosting || { enabled: false, space: '', maxGuests: 1, womenOnly: false, tags: [], rules: [] },
  createdAt: u.createdAt,
});

/* ---------------------------------------------------------------- helpers */

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readBody(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/** Very small in-memory rate limiter for the auth endpoints. */
const attempts = new Map();
function tooManyAttempts(ip) {
  const rec = attempts.get(ip) || { count: 0, at: Date.now() };
  if (Date.now() - rec.at > 15 * 60 * 1000) {
    attempts.set(ip, { count: 1, at: Date.now() });
    return false;
  }
  rec.count += 1;
  attempts.set(ip, rec);
  return rec.count > 20;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const file = path.normalize(path.join(ROOT, rel));

  if (!file.startsWith(ROOT) || file.startsWith(DATA_DIR)) {
    return json(res, 403, { error: 'forbidden' });
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      // single-page app: everything unknown falls back to index.html
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        if (e2) return json(res, 404, { error: 'not found' });
        res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
        res.end(withServerFlag(html));
      });
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=600',
    });
    res.end(ext === '.html' ? withServerFlag(buf) : buf);
  });
}

/**
 * Tell the browser a real backend is present, so the app skips its probe
 * request. The static build has no such tag and runs in demo mode.
 */
function withServerFlag(html) {
  return Buffer.from(
    String(html).replace('<head>', '<head>\n  <meta name="stayfolk-server" content="1" />')
  );
}

function serveUpload(res, pathname) {
  const name = path.basename(pathname);
  const file = path.join(UPLOAD_DIR, name);
  fs.readFile(file, (err, buf) => {
    if (err) return json(res, 404, { error: 'not found' });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(buf);
  });
}

/* ------------------------------------------------------------------ views */

function threadsFor(user) {
  const myHostId = user.hosting && user.hosting.enabled ? user.id : null;
  return db.threads.filter((t) => t.userId === user.id || (myHostId && t.hostId === myHostId));
}

function messagesForThreads(threads) {
  const ids = new Set(threads.map((t) => t.id));
  return db.messages.filter((m) => ids.has(m.threadId));
}

function bootstrapFor(user) {
  const hosts = allHosts();
  const mail = { configured: mailer.isConfigured(), provider: mailer.provider() };
  if (!user) {
    return { me: null, hosts, requests: [], threads: [], messages: [], reviews: db.reviews.slice(-60), mail };
  }
  const myHostId = user.hosting && user.hosting.enabled ? user.id : null;
  const requests = db.requests.filter((r) => r.userId === user.id || (myHostId && r.hostId === myHostId));
  const threads = threadsFor(user);
  return {
    me: publicUser(user),
    hosts,
    requests: requests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    threads,
    messages: messagesForThreads(threads),
    reviews: db.reviews.slice(-60),
    mail,
  };
}

/* ----------------------------------------------------------------- routes */

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;
  const method = req.method;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (method === 'OPTIONS') return json(res, 204, {});
  if (pathname === '/api/health') {
    return json(res, 200, {
      ok: true, users: db.users.length, messages: db.messages.length,
      mail: mailer.provider(),
    });
  }

  /* ---- auth ---- */
  if (pathname === '/api/auth/signup' && method === 'POST') {
    if (tooManyAttempts(ip)) return json(res, 429, { error: 'too many attempts, try later' });
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 80);
    const username = String(body.username || '').trim().toLowerCase();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name || !email || password.length < 8) {
      return json(res, 422, { error: 'Name, email and a password of at least 8 characters are required.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json(res, 422, { error: 'That email address does not look right.' });
    }
    if (!USERNAME_RE.test(username)) {
      return json(res, 422, { error: 'Usernames are 3–20 characters: letters, numbers and underscore only.' });
    }
    if (db.users.some((u) => u.email === email)) {
      return json(res, 409, { error: 'An account with that email already exists.' });
    }
    if (db.users.some((u) => u.username === username)) {
      return json(res, 409, { error: 'That username is already taken.' });
    }

    const verifyToken = crypto.randomBytes(24).toString('hex');
    const user = {
      id: uid('u'),
      name,
      username,
      email,
      password: hashPassword(password),
      city: String(body.city || '').trim().slice(0, 80),
      bio: '',
      languages: [],
      avatar: null,
      cover: null,
      verified: false,
      emailVerified: false,
      tokens: { verify: verifyToken, verifyAt: Date.now() },
      role: db.users.length === 0 ? 'admin' : 'member',
      hosting: { enabled: false, space: '', maxGuests: 1, womenOnly: false, tags: [], rules: [] },
      createdAt: now(),
    };
    db.users.push(user);
    startSession(res, user.id);
    save();

    const delivered = await mailer.sendVerification({
      baseUrl: PUBLIC_URL(), to: email, name, token: verifyToken,
    });
    return json(res, 201, { user: publicUser(user), verificationEmailSent: delivered });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    if (tooManyAttempts(ip)) return json(res, 429, { error: 'too many attempts, try later' });
    const body = await readBody(req);
    const identifier = String(body.email || body.username || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email === identifier || u.username === identifier);
    if (!user || !verifyPassword(body.password, user.password)) {
      return json(res, 401, { error: 'Email, username or password is incorrect.' });
    }
    startSession(res, user.id);
    return json(res, 200, { user: publicUser(user) });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    endSession(req, res);
    return json(res, 200, { ok: true });
  }

  /* ---- bootstrap ---- */
  if (pathname === '/api/bootstrap' && method === 'GET') {
    return json(res, 200, bootstrapFor(currentUser(req)));
  }

  /* ---- me ---- */
  const me = currentUser(req);

  /* ---- mail diagnostic ---- */
  if (pathname === '/api/mail/test' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const result = await mailer.sendTest({ to: me.email, name: me.name });
    return json(res, 200, result);
  }

  /* ---- email verification ---- */
  if (pathname === '/api/auth/verify' && (method === 'POST' || method === 'GET')) {
    const token = method === 'GET' ? searchParams.get('token') : (await readBody(req)).token;
    if (!token) return json(res, 422, { error: 'That link is missing its token.' });
    const user = db.users.find((u) => u.tokens && u.tokens.verify === token);
    if (!user) return json(res, 400, { error: 'That link is invalid or has already been used.' });
    if (Date.now() - (user.tokens.verifyAt || 0) > 24 * 60 * 60 * 1000) {
      return json(res, 400, { error: 'That link has expired. Ask for a new one.' });
    }
    user.emailVerified = true;
    delete user.tokens.verify;
    save();
    return json(res, 200, { ok: true, user: publicUser(user) });
  }

  if (pathname === '/api/auth/resend-verification' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    if (me.emailVerified) return json(res, 200, { ok: true, alreadyVerified: true });
    if (Date.now() - ((me.tokens && me.tokens.verifyAt) || 0) < 60 * 1000) {
      return json(res, 429, { error: 'A link was just sent — give it a minute.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    me.tokens = { ...(me.tokens || {}), verify: token, verifyAt: Date.now() };
    save();
    const delivered = await mailer.sendVerification({
      baseUrl: PUBLIC_URL(), to: me.email, name: me.name, token,
    });
    return json(res, 200, { ok: true, verificationEmailSent: delivered });
  }

  /* ---- password reset ---- */
  if (pathname === '/api/auth/forgot' && method === 'POST') {
    if (tooManyAttempts(ip)) return json(res, 429, { error: 'Too many attempts, try again later.' });
    const body = await readBody(req);
    const identifier = String(body.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email === identifier || u.username === identifier);
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      user.tokens = { ...(user.tokens || {}), reset: token, resetAt: Date.now() };
      save();
      await mailer.sendPasswordReset({ baseUrl: PUBLIC_URL(), to: user.email, name: user.name, token });
    }
    // the same answer either way, so the endpoint cannot be used to find accounts
    return json(res, 200, { ok: true });
  }

  if (pathname === '/api/auth/reset' && method === 'POST') {
    const body = await readBody(req);
    const token = String(body.token || '');
    const password = String(body.password || '');
    if (password.length < 8) {
      return json(res, 422, { error: 'The new password needs at least 8 characters.' });
    }
    const user = db.users.find((u) => u.tokens && u.tokens.reset === token);
    if (!user) return json(res, 400, { error: 'That link is invalid or has expired.' });
    if (Date.now() - (user.tokens.resetAt || 0) > 60 * 60 * 1000) {
      return json(res, 400, { error: 'That link has expired. Ask for a new one.' });
    }
    user.password = hashPassword(password);
    user.emailVerified = true;
    delete user.tokens.reset;
    for (const [t, s] of Object.entries(db.sessions)) if (s.userId === user.id) delete db.sessions[t];
    save();
    return json(res, 200, { ok: true });
  }

  /* ---- change password while signed in ---- */
  if (pathname === '/api/me/password' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const current = String(body.current || '');
    const next = String(body.next || '');
    if (!verifyPassword(current, me.password)) {
      return json(res, 403, { error: 'Your current password is not right.' });
    }
    if (next.length < 8) return json(res, 422, { error: 'The new password needs at least 8 characters.' });
    if (next === current) return json(res, 422, { error: 'Pick a password you have not used here before.' });
    me.password = hashPassword(next);
    // keep the session doing the change, sign out every other device
    const keep = parseCookies(req)[COOKIE];
    for (const [token, s] of Object.entries(db.sessions)) {
      if (s.userId === me.id && token !== keep) delete db.sessions[token];
    }
    save();
    return json(res, 200, { ok: true });
  }

  if (pathname === '/api/me' && method === 'PATCH') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);

    if (body.name !== undefined) me.name = String(body.name).trim().slice(0, 80) || me.name;
    if (body.username !== undefined) {
      const username = String(body.username).trim().toLowerCase();
      if (!USERNAME_RE.test(username)) {
        return json(res, 422, { error: 'Usernames are 3–20 characters: letters, numbers and underscore only.' });
      }
      if (db.users.some((u) => u.username === username && u.id !== me.id)) {
        return json(res, 409, { error: 'That username is already taken.' });
      }
      me.username = username;
    }
    if (body.city !== undefined) me.city = String(body.city).trim().slice(0, 80);
    if (body.bio !== undefined) me.bio = String(body.bio).slice(0, 2000);
    if (body.languages !== undefined) {
      me.languages = (Array.isArray(body.languages) ? body.languages : []).slice(0, 12).map((l) => String(l).slice(0, 30));
    }
    if (body.hosting !== undefined && typeof body.hosting === 'object') {
      const h = body.hosting;
      me.hosting = {
        enabled: Boolean(h.enabled),
        space: String(h.space || '').slice(0, 120),
        maxGuests: Math.min(6, Math.max(1, Number(h.maxGuests) || 1)),
        womenOnly: Boolean(h.womenOnly),
        tags: (Array.isArray(h.tags) ? h.tags : []).slice(0, 8).map((t) => String(t).slice(0, 30)),
        rules: (Array.isArray(h.rules) ? h.rules : []).slice(0, 8).map((t) => String(t).slice(0, 120)),
      };
    }
    save();
    return json(res, 200, { user: publicUser(me) });
  }

  if (pathname === '/api/me/photo' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const kind = body.kind === 'cover' ? 'cover' : 'avatar';
    const dataUrl = String(body.dataUrl || '');
    const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return json(res, 422, { error: 'Unsupported image format.' });

    const buf = Buffer.from(match[2], 'base64');
    if (buf.length > 6 * 1024 * 1024) return json(res, 413, { error: 'Image is too large.' });

    const ext = match[1] === 'png' ? '.png' : match[1] === 'webp' ? '.webp' : '.jpg';
    const filename = `${me.id}-${kind}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);

    const previous = me[kind];
    me[kind] = `/uploads/${filename}`;
    if (previous && previous.startsWith('/uploads/')) {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(previous)));
      } catch {
        /* old file already gone */
      }
    }
    save();
    return json(res, 200, { user: publicUser(me), url: me[kind] });
  }

  if (pathname === '/api/me/photo' && method === 'DELETE') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const kind = searchParams.get('kind') === 'cover' ? 'cover' : 'avatar';
    const previous = me[kind];
    me[kind] = null;
    if (previous && previous.startsWith('/uploads/')) {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(previous)));
      } catch {
        /* ignore */
      }
    }
    save();
    return json(res, 200, { user: publicUser(me) });
  }

  /* ---- requests ---- */
  if (pathname === '/api/requests' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const host = findHost(String(body.hostId || ''));
    if (!host) return json(res, 404, { error: 'Host not found.' });
    if (host.id === me.id) return json(res, 422, { error: 'You cannot request your own place.' });
    if (!body.from || !body.to || !body.message) {
      return json(res, 422, { error: 'Dates and a message are required.' });
    }

    const open = db.requests.filter(
      (r) => r.userId === me.id && r.hostId === host.id && r.status === 'pending'
    ).length;
    if (open >= 3) return json(res, 429, { error: 'You already have open requests with this host.' });

    const request = {
      id: uid('r'),
      hostId: host.id,
      hostName: host.name,
      userId: me.id,
      guestName: me.name,
      from: String(body.from),
      to: String(body.to),
      guests: Math.min(6, Math.max(1, Number(body.guests) || 1)),
      message: String(body.message).slice(0, 4000),
      status: 'pending',
      createdAt: now(),
    };
    db.requests.unshift(request);
    save();
    return json(res, 201, { request });
  }

  if (pathname.startsWith('/api/requests/') && method === 'PATCH') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const id = pathname.split('/')[3];
    const body = await readBody(req);
    const request = db.requests.find((r) => r.id === id);
    if (!request) return json(res, 404, { error: 'Request not found.' });
    if (request.hostId !== me.id) return json(res, 403, { error: 'Only the host can answer.' });
    if (!['accepted', 'declined'].includes(body.status)) {
      return json(res, 422, { error: 'Status must be accepted or declined.' });
    }
    request.status = body.status;
    request.respondedAt = now();
    save();
    return json(res, 200, { request });
  }

  /* ---- threads + messages ---- */
  if (pathname === '/api/threads' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const hostId = String(body.hostId || '');
    const guestId = String(body.userId || me.id);

    if (me.id !== hostId && me.id !== guestId) {
      return json(res, 403, { error: 'Not your conversation.' });
    }

    let thread = db.threads.find((t) => t.hostId === hostId && t.userId === guestId);
    if (!thread) {
      const host = findHost(hostId);
      const guest = db.users.find((u) => u.id === guestId);
      thread = {
        id: uid('t'),
        hostId,
        userId: guestId,
        hostName: host ? host.name : 'Host',
        guestName: guest ? guest.name : 'Guest',
        updatedAt: now(),
      };
      db.threads.unshift(thread);
      save();
    }
    return json(res, 200, { thread });
  }

  if (pathname.startsWith('/api/threads/') && pathname.endsWith('/messages')) {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const threadId = pathname.split('/')[3];
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread) return json(res, 404, { error: 'Conversation not found.' });
    if (thread.userId !== me.id && thread.hostId !== me.id) {
      return json(res, 403, { error: 'Not your conversation.' });
    }

    if (method === 'GET') {
      return json(res, 200, { messages: db.messages.filter((m) => m.threadId === threadId) });
    }

    if (method === 'POST') {
      const body = await readBody(req);
      const text = String(body.text || '').trim().slice(0, 4000);
      if (!text) return json(res, 422, { error: 'Message is empty.' });
      const message = { id: uid('m'), threadId, senderId: me.id, text, at: now() };
      db.messages.push(message);
      thread.updatedAt = message.at;
      save();
      return json(res, 201, { message });
    }
  }

  /* ---- sync (polling) ---- */
  if (pathname === '/api/sync' && method === 'GET') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const since = searchParams.get('since') || '1970-01-01T00:00:00.000Z';
    const threads = threadsFor(me);
    const ids = new Set(threads.map((t) => t.id));
    const messages = db.messages.filter((m) => ids.has(m.threadId) && m.at > since);
    const myHostId = me.hosting && me.hosting.enabled ? me.id : null;
    const requests = db.requests.filter(
      (r) => (r.userId === me.id || (myHostId && r.hostId === myHostId)) && (r.createdAt > since || r.respondedAt > since)
    );
    return json(res, 200, { messages, requests, threads, serverTime: now() });
  }

  /* ---- reviews + reports ---- */
  if (pathname === '/api/reviews' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const host = findHost(String(body.hostId || ''));
    if (!host) return json(res, 404, { error: 'Host not found.' });
    const review = {
      id: uid('rev'),
      hostId: host.id,
      authorId: me.id,
      author: me.name,
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      date: now().slice(0, 7),
      text: String(body.text || '').slice(0, 2000),
    };
    db.reviews.push(review);
    save();
    return json(res, 201, { review });
  }

  if (pathname === '/api/reports' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'Sign in first.' });
    const body = await readBody(req);
    const report = {
      id: uid('rp'),
      reporterId: me.id,
      targetType: String(body.targetType || 'host'),
      targetId: String(body.targetId || ''),
      targetName: String(body.targetName || ''),
      reason: String(body.reason || '').slice(0, 200),
      detail: String(body.detail || '').slice(0, 2000),
      status: 'open',
      createdAt: now(),
    };
    db.reports.unshift(report);
    save();
    return json(res, 201, { report });
  }

  return json(res, 404, { error: 'Unknown endpoint.' });
}

/* ------------------------------------------------------------------ server */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname.startsWith('/uploads/')) return serveUpload(res, url.pathname);
    return serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error('[stayfolk]', err);
    return json(res, 400, { error: err.message || 'Bad request.' });
  }
});

(async () => {
  loadDB();
  await loadSeed();
  server.listen(PORT, () => {
    console.log(`StayFolk running → http://localhost:${PORT}`);
    console.log(`Database: ${DB_FILE}`);
    console.log(`Mail: ${mailer.provider()}${mailer.isConfigured() ? ' (configured)' : ' (links go to this log)'}`);
  });
})();

module.exports = server;
