/**
 * StayFolk — store.
 *
 * Two modes, one API:
 *   remote — a real server is answering (see /server). Accounts, photos,
 *            requests and messages are shared between people and devices.
 *   local  — no server (e.g. the GitHub Pages demo). Everything lives in
 *            localStorage so the site still works end to end.
 *
 * Views read the state synchronously; mutations return promises so the
 * caller can re-render once the server has answered.
 */

import {
  HOSTS, DEMO_USERS, SEED_REQUESTS, SEED_THREADS, SEED_MESSAGES,
  SEED_REPORTS, SEED_VERIFICATIONS,
} from './data.js';
import { api, detect } from './api.js';

const KEY = 'stayfolk.v1';

const defaults = () => ({
  hosts: HOSTS,
  users: DEMO_USERS.map((u) => ({ ...u })),
  session: null,
  me: null,
  requests: SEED_REQUESTS.map((r) => ({ ...r })),
  threads: SEED_THREADS.map((r) => ({ ...r })),
  messages: SEED_MESSAGES.map((r) => ({ ...r })),
  reviews: [],
  reports: SEED_REPORTS.map((r) => ({ ...r })),
  verifications: SEED_VERIFICATIONS.map((r) => ({ ...r })),
  photos: {},
  formC: {},
  lang: 'en',
  theme: 'light',
});

let mode = 'local';
let state = defaults();
let syncSince = new Date().toISOString();
const listeners = new Set();

export const isRemote = () => mode === 'remote';
export const mailConfigured = () => state.mailConfigured !== false;
export const get = () => state;
export const hosts = () => (state.hosts && state.hosts.length ? state.hosts : HOSTS);
export const hostById = (id) => hosts().find((h) => h.id === id) || null;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

function commit(patch = {}) {
  state = { ...state, ...patch };
  if (mode === 'local') persistLocal();
  notify();
  return state;
}

/* ------------------------------------------------------------ local cache */

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

function persistLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — the demo keeps working in memory */
  }
}

/* ------------------------------------------------------------------ boot */

function fromBootstrap(boot) {
  const previous = state;
  return {
    ...defaults(),
    hosts: boot.hosts && boot.hosts.length ? boot.hosts : HOSTS,
    me: boot.me || null,
    users: [],
    session: boot.me ? boot.me.id : null,
    requests: boot.requests || [],
    threads: boot.threads || [],
    messages: boot.messages || [],
    reviews: boot.reviews || [],
    mailConfigured: boot.mail ? Boolean(boot.mail.configured) : true,
    reports: [],
    verifications: [],
    photos: {},
    formC: previous.formC || {},
    lang: previous.lang || 'en',
    theme: previous.theme || 'light',
  };
}

/** Decide which mode we are in and load the first payload. */
export async function init() {
  state = loadLocal();
  // The Node server injects this tag; a static host does not. Skipping the
  // probe keeps the console clean on GitHub Pages.
  if (!document.querySelector('meta[name="stayfolk-server"]')) {
    mode = 'local';
    return mode;
  }
  const boot = await detect();
  if (!boot) {
    mode = 'local';
    return mode;
  }
  mode = 'remote';
  state = fromBootstrap(boot);
  syncSince = new Date().toISOString();
  notify();
  return mode;
}

async function refresh() {
  const boot = await api.get('api/bootstrap');
  state = fromBootstrap(boot);
  syncSince = new Date().toISOString();
  notify();
}

export async function reset() {
  if (mode === 'remote') return refresh();
  state = defaults();
  persistLocal();
  notify();
}

/* ------------------------------------------------------------------ auth */

export const currentUser = () =>
  mode === 'remote' ? state.me : state.users.find((u) => u.id === state.session) || null;

export async function login(email, password) {
  if (mode === 'remote') {
    await api.post('api/auth/login', { email, password });
    await refresh();
    return state.me;
  }
  const user = state.users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase().trim() && u.password === password
  );
  if (!user) return null;
  commit({ session: user.id });
  return user;
}

export async function signup({ name, username, email, password, city }) {
  if (mode === 'remote') {
    const res = await api.post('api/auth/signup', { name, username, email, password, city });
    await refresh();
    return { user: res.user, verificationEmailSent: res.verificationEmailSent };
  }
  const exists = state.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) return { error: 'exists' };
  const user = {
    id: `u_${Date.now().toString(36)}`,
    name: String(name).trim(),
    username: String(username || '').trim().toLowerCase(),
    email: String(email).trim(),
    emailVerified: true,
    password,
    role: 'guest',
    hostId: null,
    city: city || '—',
    verified: false,
  };
  commit({ users: [...state.users, user], session: user.id });
  return { user };
}

export async function logout() {
  if (mode === 'remote') {
    await api.post('api/auth/logout', {});
    await refresh();
    return;
  }
  commit({ session: null });
}

/* ------------------------------------------------- verification + reset */

export async function verifyEmail(token) {
  if (mode !== 'remote') return { ok: true };
  return api.post('api/auth/verify', { token });
}

export async function sendTestEmail() {
  if (mode !== 'remote') return { ok: false, provider: 'demo', error: 'Only the live site can send email.' };
  return api.post('api/mail/test', {});
}

export async function resendVerification() {
  if (mode !== 'remote') return { ok: true };
  return api.post('api/auth/resend-verification', {});
}

export async function changePassword(current, next) {
  if (mode !== 'remote') return { ok: true };
  return api.post('api/me/password', { current, next });
}

export async function requestPasswordReset(email) {
  if (mode !== 'remote') return { ok: true };
  return api.post('api/auth/forgot', { email });
}

export async function resetPassword(token, password) {
  if (mode !== 'remote') return { ok: true };
  return api.post('api/auth/reset', { token, password });
}

/* --------------------------------------------------------------- profile */

export async function updateProfile(patch) {
  if (mode === 'remote') {
    const { user } = await api.patch('api/me', patch);
    const me = { ...state.me, ...user };
    const nextHosts = state.hosts.map((h) => (h.id === me.id ? { ...h, ...hostFromUser(me) } : h));
    if (me.hosting && me.hosting.enabled && !nextHosts.some((h) => h.id === me.id)) {
      nextHosts.push(hostFromUser(me));
    }
    commit({ me, hosts: nextHosts });
    return me;
  }
  // local mode: keep the demo host record in sync with the form
  const me = currentUser();
  if (!me) return null;
  const users = state.users.map((u) => (u.id === me.id ? { ...u, ...patch } : u));
  commit({ users });
  return users.find((u) => u.id === me.id);
}

function hostFromUser(me) {
  const hosting = me.hosting || {};
  return {
    id: me.id,
    name: me.name,
    citySlug: null,
    cityName: me.city || '',
    country: '',
    verified: Boolean(me.verified),
    womenOnly: Boolean(hosting.womenOnly),
    rating: 5,
    reviewCount: state.reviews.filter((r) => r.hostId === me.id).length,
    responseRate: 100,
    joined: (me.createdAt || new Date().toISOString()).slice(0, 7),
    languages: me.languages && me.languages.length ? me.languages : ['English'],
    maxGuests: hosting.maxGuests || 1,
    space: hosting.space || 'Spare room',
    tags: hosting.tags || [],
    bio: me.bio || '',
    rules: hosting.rules || [],
    avatar: me.avatar || null,
    cover: me.cover || null,
    gallery: me.gallery || [],
    isSeed: false,
  };
}

/* -------------------------------------------------------------- requests */

export async function createRequest({ hostId, from, to, guests, message }) {
  if (mode === 'remote') {
    const { request } = await api.post('api/requests', { hostId, from, to, guests, message });
    commit({ requests: [request, ...state.requests] });
    return request;
  }
  const user = currentUser();
  if (!user) return null;
  const req = {
    id: `r_${Date.now().toString(36)}`,
    hostId,
    userId: user.id,
    guestName: user.name,
    from,
    to,
    guests: Number(guests) || 1,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  commit({ requests: [req, ...state.requests] });
  return req;
}

export async function respondRequest(id, status) {
  if (mode === 'remote') {
    const { request } = await api.patch(`api/requests/${id}`, { status });
    commit({ requests: state.requests.map((r) => (r.id === id ? request : r)) });
    return request;
  }
  commit({ requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) });
  return state.requests.find((r) => r.id === id);
}

export const requestsForHost = (hostId) =>
  state.requests.filter((r) => r.hostId === hostId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const requestsForUser = (userId) =>
  state.requests.filter((r) => r.userId === userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

/* ------------------------------------------------------------- messaging */

export async function openThread({ hostId, userId, guestName }) {
  const targetUser = userId || (currentUser() || {}).id;

  if (mode === 'remote') {
    const { thread } = await api.post('api/threads', { hostId, userId: targetUser });
    if (!state.threads.some((t) => t.id === thread.id)) {
      commit({ threads: [thread, ...state.threads] });
    }
    return thread;
  }

  const found = state.threads.find((t) => t.hostId === hostId && t.userId === targetUser);
  if (found) return found;
  const thread = {
    id: `t_${Date.now().toString(36)}`,
    hostId,
    userId: targetUser,
    guestName,
    updatedAt: new Date().toISOString(),
  };
  commit({ threads: [thread, ...state.threads] });
  return thread;
}

export async function sendMessage(threadId, text) {
  const clean = String(text || '').trim();
  if (!clean) return null;

  if (mode === 'remote') {
    const { message } = await api.post(`api/threads/${threadId}/messages`, { text: clean });
    commit({
      messages: [...state.messages, message],
      threads: state.threads.map((t) => (t.id === threadId ? { ...t, updatedAt: message.at } : t)),
    });
    return message;
  }

  const user = currentUser();
  if (!user) return null;
  const msg = { id: `m_${Date.now().toString(36)}`, threadId, senderId: user.id, text: clean, at: new Date().toISOString() };
  commit({
    messages: [...state.messages, msg],
    threads: state.threads.map((t) => (t.id === threadId ? { ...t, updatedAt: msg.at } : t)),
  });
  return msg;
}

export const messagesFor = (threadId) =>
  state.messages.filter((m) => m.threadId === threadId).sort((a, b) => (a.at < b.at ? -1 : 1));

export function threadsFor(user) {
  if (!user) return [];
  if (mode === 'remote') {
    return [...state.threads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
  return state.threads
    .filter((t) => (user.hostId ? t.hostId === user.hostId : t.userId === user.id))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** Pull anything new since the last check. Returns true when something changed. */
export async function sync() {
  if (mode !== 'remote' || !state.me) return false;
  try {
    const data = await api.get(`api/sync?since=${encodeURIComponent(syncSince)}`);
    syncSince = data.serverTime || new Date().toISOString();

    const known = new Set(state.messages.map((m) => m.id));
    const fresh = (data.messages || []).filter((m) => !known.has(m.id));
    const changedRequests = (data.requests || []).length > 0;

    if (!fresh.length && !changedRequests) return false;

    const requests = state.requests.map((r) => {
      const updated = (data.requests || []).find((x) => x.id === r.id);
      return updated || r;
    });
    const newRequests = (data.requests || []).filter((x) => !state.requests.some((r) => r.id === x.id));

    commit({
      messages: [...state.messages, ...fresh],
      requests: [...newRequests, ...requests],
      threads: data.threads && data.threads.length ? data.threads : state.threads,
    });
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------- reviews */

export async function addReview({ hostId, rating, text }) {
  if (mode === 'remote') {
    const { review } = await api.post('api/reviews', { hostId, rating, text });
    commit({ reviews: [review, ...state.reviews] });
    return review;
  }
  const user = currentUser();
  if (!user) return null;
  const review = {
    id: `rev_${Date.now().toString(36)}`,
    hostId,
    author: user.name,
    rating: Number(rating) || 5,
    date: new Date().toISOString().slice(0, 7),
    text,
  };
  commit({ reviews: [review, ...state.reviews] });
  return review;
}

/* --------------------------------------------------------------- reports */

export async function addReport({ targetType, targetId, targetName, reason, detail }) {
  if (mode === 'remote') {
    await api.post('api/reports', { targetType, targetId, targetName, reason, detail });
    return true;
  }
  const report = {
    id: `rp_${Date.now().toString(36)}`,
    targetType, targetId, targetName, reason, detail,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  commit({ reports: [report, ...state.reports] });
  return report;
}

export async function resolveReport(id, status = 'resolved') {
  commit({ reports: state.reports.map((r) => (r.id === id ? { ...r, status } : r)) });
}

/* ---------------------------------------------------------- verification */

export async function requestVerification() {
  const user = currentUser();
  if (!user) return null;
  if (mode === 'remote') {
    await api.patch('api/me', {});
    return true;
  }
  if (state.verifications.some((v) => v.userId === user.id && v.status === 'pending')) return null;
  const entry = {
    id: `v_${Date.now().toString(36)}`,
    userId: user.id,
    name: user.name,
    city: user.city,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  commit({ verifications: [entry, ...state.verifications] });
  return entry;
}

export async function resolveVerification(id, status) {
  const entry = state.verifications.find((v) => v.id === id);
  commit({
    verifications: state.verifications.map((v) => (v.id === id ? { ...v, status } : v)),
    users: entry && status === 'approved'
      ? state.users.map((u) => (u.id === entry.userId ? { ...u, verified: true } : u))
      : state.users,
  });
}

/* ----------------------------------------------------------------- photos */

/* In the demo the signed-in host is a user linked to a host record, so an
   upload keyed by the user id must land on that host's profile. */
function photoKey(id) {
  if (mode === 'remote') return id;
  const me = currentUser();
  if (me && me.hostId && id === me.id) return me.hostId;
  return id;
}

export function photoFor(id, kind) {
  if (mode === 'remote') {
    const me = state.me;
    if (me && me.id === id) return me[kind] || null;
    const host = hostById(id);
    return host ? host[kind] || null : null;
  }
  const entry = state.photos && state.photos[photoKey(id)];
  return entry ? entry[kind] || null : null;
}

export async function setPhoto(id, kind, dataUrl) {
  if (mode === 'remote') {
    const { user } = await api.post('api/me/photo', { kind, dataUrl });
    const me = { ...state.me, ...user };
    commit({
      me,
      hosts: state.hosts.map((h) => (h.id === me.id ? { ...h, [kind]: user[kind] } : h)),
    });
    return me;
  }
  const key = photoKey(id);
  const photos = { ...(state.photos || {}) };
  photos[key] = { ...(photos[key] || {}), [kind]: dataUrl };
  commit({ photos });
  return photos[key];
}

export async function clearPhoto(id, kind) {
  if (mode === 'remote') {
    const { user } = await api.del(`api/me/photo?kind=${kind}`);
    const me = { ...state.me, ...user };
    commit({
      me,
      hosts: state.hosts.map((h) => (h.id === me.id ? { ...h, [kind]: null } : h)),
    });
    return me;
  }
  const key = photoKey(id);
  const photos = { ...(state.photos || {}) };
  if (photos[key]) {
    const next = { ...photos[key] };
    delete next[kind];
    photos[key] = next;
  }
  commit({ photos });
  return photos[key];
}

/* ------------------------------------------------------ Form C checklist */

export const formCState = () => state.formC || {};

export function toggleFormC(stepId, done) {
  commit({ formC: { ...(state.formC || {}), [stepId]: Boolean(done) } });
}

export function resetFormC() {
  commit({ formC: {} });
}

/* ------------------------------------------------------------ preferences */

export function setLang(code) {
  commit({ lang: code });
}
export function setTheme(theme) {
  commit({ theme });
}

/* ------------------------------------------------ safety + request control */

export const blockedIds = () => (currentUser() && currentUser().blocks) || [];

export async function blockUser(id, on = true) {
  if (mode === 'remote') {
    const { blocks } = on
      ? await api.post('api/blocks', { userId: id })
      : await api.del(`api/blocks?userId=${encodeURIComponent(id)}`);
    commit({ me: { ...state.me, blocks } });
    return blocks;
  }
  const me = currentUser();
  if (!me) return [];
  const cur = me.blocks || [];
  const blocks = on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id);
  commit({ users: state.users.map((u) => (u.id === me.id ? { ...u, blocks } : u)) });
  return blocks;
}

export async function deleteAccount(password) {
  if (mode === 'remote') {
    await api.del('api/me', { password });
    await refresh();
    return;
  }
  const me = currentUser();
  commit({ session: null, users: state.users.filter((u) => !me || u.id !== me.id) });
}

export async function editRequest(id, patch) {
  if (mode === 'remote') {
    const { request } = await api.patch(`api/requests/${id}`, patch);
    commit({ requests: state.requests.map((r) => (r.id === id ? request : r)) });
    return request;
  }
  commit({ requests: state.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  return state.requests.find((r) => r.id === id);
}

/* ------------------------------------------------ gallery + member profiles */

export function galleryFor(id) {
  if (mode === 'remote') {
    const me = state.me;
    if (me && me.id === id) return me.gallery || [];
    const host = hostById(id);
    return (host && host.gallery) || [];
  }
  const entry = state.photos && state.photos[photoKey(id)];
  return (entry && entry.gallery) || [];
}

export async function addGalleryPhoto(id, dataUrl) {
  if (mode === 'remote') {
    const { user } = await api.post('api/me/gallery', { dataUrl });
    const me = { ...state.me, ...user };
    commit({ me, hosts: state.hosts.map((h) => (h.id === me.id ? { ...h, gallery: user.gallery } : h)) });
    return me;
  }
  const key = photoKey(id);
  const cur = galleryFor(id);
  if (cur.length >= 8) throw new Error('You can add up to 8 photos.');
  commit({ photos: { ...(state.photos || {}), [key]: { ...((state.photos || {})[key] || {}), gallery: [...cur, dataUrl] } } });
}

export async function removeGalleryPhoto(id, index) {
  if (mode === 'remote') {
    const { user } = await api.del(`api/me/gallery?i=${index}`);
    const me = { ...state.me, ...user };
    commit({ me, hosts: state.hosts.map((h) => (h.id === me.id ? { ...h, gallery: user.gallery } : h)) });
    return me;
  }
  const key = photoKey(id);
  const next = galleryFor(id).filter((_, i) => i !== index);
  commit({ photos: { ...(state.photos || {}), [key]: { ...((state.photos || {})[key] || {}), gallery: next } } });
}

const memberCache = {};
export const cachedMember = (id) => (memberCache[id] && Date.now() - memberCache[id].at < 30000 ? memberCache[id].data : null);

export async function fetchMember(id) {
  let data;
  if (mode === 'remote') {
    data = await api.get(`api/members/${encodeURIComponent(id)}`);
  } else {
    const u = state.users.find((x) => x.id === id);
    const h = hostById(id);
    const src = u || h;
    if (!src) throw new Error('Member not found.');
    data = {
      member: {
        id, name: src.name, username: src.username || '', city: src.city || src.cityName || '', bio: src.bio || '',
        languages: src.languages || [], avatar: photoFor(id, 'avatar') || src.avatar || null,
        cover: photoFor(id, 'cover') || src.cover || null, gallery: galleryFor(id),
        verified: Boolean(src.verified), emailVerified: Boolean(src.emailVerified), joined: '', isHost: Boolean(h),
      },
      reviews: state.reviews.filter((r) => r.hostId === id),
    };
  }
  memberCache[id] = { data, at: Date.now() };
  return data;
}
