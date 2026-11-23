/**
 * StayFolk — application shell.
 * Hash router, header/footer, delegated events and toasts.
 */

import { LANGS, setLang, getLang, langMeta, t, missingKeys } from './i18n.js';
import * as store from './store.js';
import * as V from './views.js';
import { icon, esc } from './views.js';
import { BRAND_MARK, avatar } from './media.js';
import { HOSTS } from './data.js';

// hosts can come from the server (real members) or the bundled seed list
const hostById = (id) => store.hostById(id);

const $header = document.getElementById('site-header');
const $footer = document.getElementById('site-footer');
const $main = document.getElementById('main');
const $toast = document.getElementById('toast-root');
const $modal = document.getElementById('modal-root');

/* --------------------------------------------------------------- chrome */

function headerHTML() {
  const user = store.currentUser();
  const lang = getLang();
  const theme = store.get().theme;
  const path = currentPath();

  const link = (href, label, key) =>
    `<a href="${href}" class="${path === key ? 'is-active' : ''}">${esc(label)}</a>`;

  return `
  <div class="container header-inner">
    <a class="brand" href="#/" aria-label="StayFolk">
      ${BRAND_MARK}<span>StayFolk</span>
    </a>

    <nav class="nav" aria-label="Main">
      ${link('#/explore', t('nav.explore'), 'explore')}
      ${link('#/cities', t('nav.cities'), 'cities')}
      ${link('#/how', t('nav.how'), 'how')}
      ${link('#/safety', t('nav.safety'), 'safety')}
      ${user ? link('#/dashboard', t('nav.dashboard'), 'dashboard') : ''}
      ${user ? link('#/messages', t('nav.messages'), 'messages') : ''}
    </nav>

    <div class="header-actions">
      <label class="lang-select ${user ? 'hide-sm' : ''}" title="${esc(t('nav.language'))}">
        ${icon('globe')}
        <select id="lang-select" aria-label="${esc(t('nav.language'))}">
          ${LANGS.map((l) => `<option value="${l.code}" ${l.code === lang ? 'selected' : ''}>${esc(l.native)}</option>`).join('')}
        </select>
      </label>

      <button class="btn btn--outline btn--sm install-btn hide-sm" data-action="install-app">
        ${icon('plus')}${esc(t('pwa.install'))}
      </button>

      <button class="icon-btn hide-sm" data-action="toggle-theme" title="${esc(t('nav.theme'))}" aria-label="${esc(t('nav.theme'))}">
        ${icon(theme === 'dark' ? 'sun' : 'moon')}
      </button>

      ${user
        ? `<a class="icon-btn" href="#/dashboard" title="${esc(user.name)}" style="width:auto;padding:0 4px;border:0">
             <img class="avatar" src="${store.photoFor(user.id, 'avatar') || avatar(user.name, user.id)}" alt="${esc(user.name)}" />
           </a>`
        : `<a class="btn btn--ghost btn--sm btn--login" href="#/login">${esc(t('nav.login'))}</a>
           <a class="btn btn--primary btn--sm" href="#/signup">${esc(t('nav.signup'))}</a>`}

      <button class="icon-btn menu-toggle" data-action="toggle-menu" aria-label="${esc(t('nav.menu'))}" aria-expanded="false">
        ${icon('menu')}
      </button>
    </div>
  </div>

  <div class="mobile-nav" id="mobile-nav">
    <a href="#/explore">${esc(t('nav.explore'))}</a>
    <a href="#/cities">${esc(t('nav.cities'))}</a>
    <a href="#/how">${esc(t('nav.how'))}</a>
    <a href="#/safety">${esc(t('nav.safety'))}</a>
    ${user ? `<a href="#/dashboard">${esc(t('nav.dashboard'))}</a><a href="#/messages">${esc(t('nav.messages'))}</a>` : ''}
    ${user && user.role === 'admin' ? `<a href="#/admin">${esc(t('nav.admin'))}</a>` : ''}
    <div class="mobile-nav__actions">
      <button class="btn btn--outline btn--block install-btn" data-action="install-app">${icon('plus')}${esc(t('pwa.install'))}</button>
      ${user
        ? `<button class="btn btn--outline btn--block" data-action="logout">${esc(t('nav.logout'))}</button>`
        : `<a class="btn btn--outline btn--block" href="#/login">${esc(t('nav.login'))}</a>
           <a class="btn btn--primary btn--block" href="#/signup">${esc(t('nav.signup'))}</a>`}
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <a class="brand" href="#/" style="margin-bottom:12px">${BRAND_MARK}<span>StayFolk</span></a>
        <p class="small" style="max-width:34ch">${esc(t('footer.about'))}</p>
        <p class="tiny muted" style="margin-top:12px">${esc(t('footer.made'))}</p>
      </div>
      <div class="footer-col">
        <h5>${esc(t('footer.explore'))}</h5>
        <a href="#/explore">${esc(t('nav.explore'))}</a>
        <a href="#/cities">${esc(t('nav.cities'))}</a>
        <a href="#/how">${esc(t('nav.how'))}</a>
      </div>
      <div class="footer-col">
        <h5>${esc(t('footer.support'))}</h5>
        <a href="#/safety">${esc(t('nav.safety'))}</a>
        <a href="#/form-c">${esc(t('nav.formc'))}</a>
        <a href="#/signup">${esc(t('cta.host'))}</a>
        <a href="mailto:hello@stayfolk.example">${esc(t('footer.contact'))}</a>
      </div>
      <div class="footer-col">
        <h5>${esc(t('footer.legal'))}</h5>
        <a href="#/safety">${esc(t('footer.terms'))}</a>
        <a href="#/safety">${esc(t('footer.privacy'))}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>${esc(t('footer.rights'))}</span>
      <span>${esc(langMeta(getLang()).native)} · ${esc(t('common.demo'))}</span>
    </div>
  </div>`;
}

/* --------------------------------------------------------------- router */

function bottomNavHTML() {
  const user = store.currentUser();
  const p = currentPath();
  const it = (href, ic, label, on) => `<a href="${href}" class="${on ? 'is-active' : ''}">${icon(ic)}<span>${esc(label)}</span></a>`;
  return `<nav class="bottom-nav" aria-label="Main">
    ${it('#/', 'home', t('nav.home'), p === '')}
    ${it('#/explore', 'search', t('nav.explore'), p === 'explore' || p === 'host' || p === 'cities' || p === 'city')}
    ${user ? it('#/messages', 'message', t('msg.title'), p === 'messages') : it('#/how', 'globe', t('nav.how'), p === 'how')}
    ${user ? it('#/dashboard', 'users', t('nav.dashboard'), p === 'dashboard') : it('#/login', 'users', t('nav.login'), p === 'login' || p === 'signup')}
  </nav>`;
}

function currentPath() {
  const raw = location.hash.replace(/^#\/?/, '');
  return raw.split('?')[0].split('/').filter(Boolean)[0] || '';
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart || '');
  return { segs, query };
}

let lastScrollKey = '';
let verifyState = { status: 'pending' };

function route() {
  const { segs, query } = parseRoute();
  const root = segs[0] || 'home';
  let html = '';
  let title = 'StayFolk';

  switch (root) {
    case 'home':
      html = V.homeView();
      title = 'StayFolk — ' + t('hero.eyebrow');
      break;
    case 'explore':
      html = V.exploreView({
        city: query.get('city') || '',
        guests: query.get('guests') || '',
        language: query.get('language') || '',
        verified: query.get('verified') === '1',
        women: query.get('women') === '1',
        sort: query.get('sort') || 'rating',
      });
      title = `${t('search.title')} — StayFolk`;
      break;
    case 'cities':
      html = V.citiesView();
      title = `${t('cities.title')} — StayFolk`;
      break;
    case 'city':
      html = V.cityView(segs[1]);
      title = `${t('cities.title')} — StayFolk`;
      break;
    case 'host': {
      const h = hostById(segs[1]);
      html = V.hostView(segs[1]);
      title = h ? `${h.name} — StayFolk` : 'StayFolk';
      break;
    }
    case 'how':
      html = V.howView();
      title = `${t('nav.how')} — StayFolk`;
      break;
    case 'safety':
      html = V.safetyView();
      title = `${t('nav.safety')} — StayFolk`;
      break;
    case 'form-c':
      html = V.formCView();
      title = `${t('formc.title')} — StayFolk`;
      break;
    case 'login':
      html = V.authView('login');
      title = `${t('nav.login')} — StayFolk`;
      break;
    case 'forgot':
      html = V.forgotView();
      title = `${t('auth.forgot')} — StayFolk`;
      break;
    case 'reset':
      html = V.resetView(query.get('token') || '');
      title = `${t('auth.resetTitle')} — StayFolk`;
      break;
    case 'verify': {
      html = V.verifyView(verifyState);
      title = `${t('auth.verifyTitle')} — StayFolk`;
      const token = query.get('token') || '';
      if (token && !verifyState.started) {
        verifyState = { status: 'pending', started: true };
        // keep `started` set, otherwise the re-render would fire the same
        // one-time token again and overwrite the success message with an error
        store.verifyEmail(token)
          .then(() => { verifyState = { status: 'ok', started: true }; route(); })
          .catch((err) => { verifyState = { status: 'error', message: err.message, started: true }; route(); });
      }
      break;
    }
    case 'signup':
      html = V.authView('signup');
      title = `${t('nav.signup')} — StayFolk`;
      break;
    case 'dashboard':
      html = V.dashboardView(segs[1] || 'requests');
      title = `${t('nav.dashboard')} — StayFolk`;
      break;
    case 'messages':
      html = V.messagesView(segs[1]);
      title = `${t('msg.title')} — StayFolk`;
      break;
    case 'admin':
      html = V.adminView(segs[1] || 'reports');
      title = `${t('nav.admin')} — StayFolk`;
      break;
    default:
      html = V.notFoundView();
  }

  document.title = title;
  $main.innerHTML = `<div class="view-enter">${html}</div>`;
  $header.innerHTML = headerHTML();
  $footer.innerHTML = footerHTML() + bottomNavHTML();

  const key = location.hash;
  if (key !== lastScrollKey) {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    lastScrollKey = key;
  }

  const body = document.getElementById('thread-body');
  if (body) body.scrollTop = body.scrollHeight;
}

function go(path) {
  location.hash = path.startsWith('#') ? path : `#${path}`;
}

/* ---------------------------------------------------------------- toasts */

export function toast(message, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind === 'error' ? 'toast--error' : ''}`;
  el.innerHTML = `${icon(kind === 'error' ? 'x' : 'check')}<span>${esc(message)}</span>`;
  $toast.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'all .25s';
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

/* -------------------------------------------------------------- language */

function applyLanguage() {
  const meta = langMeta(getLang());
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
}

/* --------------------------------------------------------------- modals */

function openModal(html) {
  $modal.innerHTML = html;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $modal.innerHTML = '';
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------- events */

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'close-modal') {
    if (el.classList.contains('modal-backdrop') && e.target !== el) return;
    closeModal();
    return;
  }

  switch (action) {
    case 'toggle-theme': {
      const next = store.get().theme === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
      document.documentElement.dataset.theme = next;
      $header.innerHTML = headerHTML();
      break;
    }
    case 'toggle-menu': {
      const nav = document.getElementById('mobile-nav');
      const open = nav.classList.toggle('is-open');
      el.setAttribute('aria-expanded', String(open));
      break;
    }
    case 'logout': {
      await store.logout();
      toast(t('nav.logout'));
      go('/');
      break;
    }
    case 'open-request': {
      if (!store.currentUser()) {
        toast(t('req.login'), 'error');
        go('/login');
        return;
      }
      openModal(V.requestModal(el.dataset.id));
      break;
    }
    case 'report': {
      openModal(V.reportModal(el.dataset.id, el.dataset.name || ''));
      break;
    }
    case 'copy-link': {
      const url = location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => toast(t('common.copy'))).catch(() => toast(url));
      } else {
        toast(url);
      }
      break;
    }
    case 'clear-filters': {
      go('/explore');
      break;
    }
    case 'print': {
      window.print();
      break;
    }
    case 'reset-formc': {
      store.resetFormC();
      route();
      break;
    }
    case 'clear-photo': {
      await store.clearPhoto(el.dataset.host, el.dataset.kind);
      route();
      break;
    }
    case 'install-app': {
      if (!deferredPrompt) {
        toast(t('pwa.installed'));
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        deferredPrompt = null;
        syncInstall();
      });
      break;
    }
    case 'respond': {
      await store.respondRequest(el.dataset.id, el.dataset.status);
      toast(el.dataset.status === 'accepted' ? t('dash.accepted') : t('dash.declined'));
      route();
      break;
    }
    case 'message-guest': {
      const user = store.currentUser();
      const req = store.get().requests.find((r) => r.id === el.dataset.id);
      if (!user || !req) return;
      const thread = await store.openThread({
        hostId: req.hostId,
        userId: req.userId,
        guestName: req.guestName,
      });
      go(`/messages/${thread.id}`);
      break;
    }
    case 'test-email': {
      const res = await store.sendTestEmail();
      if (res.ok) toast(t('mail.testOk'));
      else toast(`${res.provider}: ${res.error}`, 'error');
      break;
    }
    case 'resend-verification': {
      try {
        await store.resendVerification();
        toast(t('auth.verifySent'));
      } catch (err) {
        toast(err.message || t('auth.verifyFail'), 'error');
      }
      break;
    }
    case 'verify-me': {
      const entry = await store.requestVerification();
      toast(entry ? t('dash.verify') : t('dash.pending'));
      route();
      break;
    }
    case 'resolve-report': {
      await store.resolveReport(el.dataset.id, 'resolved');
      toast(t('admin.approve'));
      route();
      break;
    }
    case 'ban-user': {
      await store.resolveReport(el.dataset.id, 'banned');
      toast(t('admin.ban'));
      route();
      break;
    }
    case 'verify-approve': {
      await store.resolveVerification(el.dataset.id, 'approved');
      toast(t('admin.approve'));
      route();
      break;
    }
    case 'verify-reject': {
      await store.resolveVerification(el.dataset.id, 'rejected');
      toast(t('admin.reject'));
      route();
      break;
    }
    default:
      break;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'lang-select' || e.target.classList.contains('lang-pick')) {
    const code = e.target.value;
    store.setLang(code);
    setLang(code);
    applyLanguage();
    toast(langMeta(code).native);
    route();
    return;
  }
  if (e.target.id === 'sort-select') {
    const params = new URLSearchParams((location.hash.split('?')[1] || ''));
    if (e.target.value === 'rating') params.delete('sort');
    else params.set('sort', e.target.value);
    const qs = params.toString();
    go(`/explore${qs ? '?' + qs : ''}`);
    return;
  }

  const formcBox = e.target.closest('input[data-formc]');
  if (formcBox) {
    store.toggleFormC(formcBox.dataset.formc, formcBox.checked);
    route();
    return;
  }

  const photoInput = e.target.closest('input[type="file"][data-photo]');
  if (photoInput) {
    handlePhoto(photoInput);
    return;
  }

  const filters = e.target.closest('#filters-form');
  if (filters) applyFilters(filters);
});

/* Downscale before storing so a 12 MP phone photo cannot blow the quota. */
function readImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhoto(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast(t('upload.hint'), 'error');
  if (file.size > 8 * 1024 * 1024) return toast(t('upload.hint'), 'error');

  try {
    const kind = input.dataset.photo;
    const dataUrl = await readImage(file, kind === 'avatar' ? 640 : 1600);
    await store.setPhoto(input.dataset.host, kind, dataUrl);
    toast(t('upload.change'));
    route();
  } catch {
    toast(t('upload.hint'), 'error');
  }
}

function applyFilters(form) {
  const fd = new FormData(form);
  const params = new URLSearchParams();
  const city = String(fd.get('city') || '').trim();
  if (city) params.set('city', city);
  if (fd.get('guests')) params.set('guests', fd.get('guests'));
  if (fd.get('language')) params.set('language', fd.get('language'));
  if (fd.get('verified')) params.set('verified', '1');
  if (fd.get('women')) params.set('women', '1');
  if (fd.get('sort') && fd.get('sort') !== 'rating') params.set('sort', fd.get('sort'));
  const qs = params.toString();
  const next = `/explore${qs ? '?' + qs : ''}`;
  if (location.hash === `#${next}`) return;
  go(next);
}

document.addEventListener('submit', async (e) => {
  const form = e.target;

  if (form.id === 'hero-search') {
    e.preventDefault();
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const city = String(fd.get('city') || '').trim();
    if (city) params.set('city', city);
    if (fd.get('guests')) params.set('guests', fd.get('guests'));
    go(`/explore${params.toString() ? '?' + params : ''}`);
    return;
  }

  if (form.id === 'filters-form') {
    e.preventDefault();
    applyFilters(form);
    return;
  }

  if (form.id === 'auth-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const mode = form.dataset.mode;
    const errorEl = form.querySelector('#auth-error');
    const showError = (msg) => {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    };

    if (mode === 'login') {
      const user = await store.login(fd.get('email'), fd.get('password'));
      if (!user) return showError(t('auth.invalid'));
      toast(t('auth.welcome', { name: user.name }));
      go(user.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      if (!name || !email || password.length < 6) {
        return showError(`${t('auth.name')} · ${t('auth.email')} · ${t('auth.password')}`);
      }
      const username = String(fd.get('username') || '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) return showError(t('auth.usernameHint'));
      if (password.length < 8) return showError(t('auth.passwordHint'));

      let res;
      try {
        res = await store.signup({ name, username, email, password, city: fd.get('city') });
      } catch (err) {
        return showError(err.message || t('auth.invalid'));
      }
      if (res.error === 'exists') return showError(t('auth.invalid'));

      const photo = form.querySelector('#a-photo');
      const file = photo && photo.files && photo.files[0];
      if (file && store.currentUser()) {
        try {
          const dataUrl = await readImage(file, 640);
          await store.setPhoto(store.currentUser().id, 'avatar', dataUrl);
        } catch {
          /* a failed photo must not block the signup */
        }
      }

      toast(t('auth.welcome', { name: res.user.name }));
      go('/dashboard');
    }
    return;
  }

  if (form.id === 'request-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const hostId = form.dataset.host;
    const from = String(fd.get('from') || '');
    const to = String(fd.get('to') || '');
    if (!from || !to || to < from) {
      toast(t('search.when'), 'error');
      return;
    }
    await store.createRequest({
      hostId,
      from,
      to,
      guests: fd.get('guests'),
      message: String(fd.get('message') || '').trim(),
    });
    const host = hostById(hostId);
    closeModal();
    toast(t('req.sent', { name: host ? host.name : '' }));
    route();
    return;
  }

  if (form.id === 'msg-form') {
    e.preventDefault();
    const input = form.querySelector('input[name="text"]');
    if (await store.sendMessage(form.dataset.thread, input.value)) {
      input.value = '';
      route();
    }
    return;
  }

  if (form.id === 'password-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const errorEl = form.querySelector('#password-error');
    try {
      await store.changePassword(String(fd.get('current') || ''), String(fd.get('next') || ''));
      errorEl.hidden = true;
      form.reset();
      toast(t('auth.passwordChanged'));
    } catch (err) {
      errorEl.textContent = err.message || t('auth.verifyFail');
      errorEl.hidden = false;
    }
    return;
  }

  if (form.id === 'forgot-form') {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await store.requestPasswordReset(String(fd.get('email') || ''));
      toast(t('auth.resetSent'));
      go('/login');
    } catch (err) {
      toast(err.message || t('auth.verifyFail'), 'error');
    }
    return;
  }

  if (form.id === 'reset-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const errorEl = form.querySelector('#reset-error');
    try {
      await store.resetPassword(form.dataset.token, String(fd.get('password') || ''));
      toast(t('auth.passwordChanged'));
      go('/login');
    } catch (err) {
      errorEl.textContent = err.message || t('auth.verifyFail');
      errorEl.hidden = false;
    }
    return;
  }

  if (form.id === 'profile-form') {
    e.preventDefault();
    const fd = new FormData(form);
    const languages = [...form.querySelectorAll('select[name="languages"] option:checked')].map((o) => o.value);
    try {
      await store.updateProfile({
        name: String(fd.get('name') || '').trim(),
        city: String(fd.get('city') || '').trim(),
        bio: String(fd.get('bio') || ''),
        languages,
        hosting: {
          enabled: Boolean(fd.get('hosting')),
          space: String(fd.get('space') || ''),
          maxGuests: Number(fd.get('maxGuests')) || 1,
          womenOnly: Boolean(fd.get('womenOnly')),
        },
      });
      toast(t('profile.saved'));
      route();
    } catch (err) {
      toast(err.message || t('auth.invalid'), 'error');
    }
    return;
  }

  if (form.id === 'report-form') {
    e.preventDefault();
    const fd = new FormData(form);
    await store.addReport({
      targetType: 'host',
      targetId: form.dataset.id,
      targetName: form.dataset.name,
      reason: String(fd.get('reason') || ''),
      detail: String(fd.get('detail') || ''),
    });
    closeModal();
    toast(t('admin.reports'));
    route();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

window.addEventListener('hashchange', route);

/* ------------------------------------------------------------------ boot */

/* ------------------------------------------------------------------- pwa */

let deferredPrompt = null;

function syncInstall() {
  document.querySelectorAll('.install-btn').forEach((b) => {
    b.classList.toggle('is-visible', Boolean(deferredPrompt));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  syncInstall();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  syncInstall();
  toast(t('pwa.installed'));
});

/** Poll for new messages and requests while the app is open. */
function startPolling() {
  if (!store.isRemote()) return;
  setInterval(async () => {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
    if (!store.currentUser()) return;
    const changed = await store.sync();
    if (!changed) return;
    const path = currentPath();
    if (path === 'messages' || path === 'dashboard') route();
  }, 5000);
}

async function boot() {
  await store.init();

  const s = store.get();
  setLang(s.lang || 'en');
  applyLanguage();
  document.documentElement.dataset.theme = s.theme || 'light';

  if (!location.hash) location.hash = '#/';
  route();
  syncInstall();
  startPolling();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* offline support is a bonus, never a blocker */
      });
    });
  }

  if (import.meta.env && import.meta.env.DEV) {
    const missing = missingKeys();
    if (Object.keys(missing).length) console.warn('Missing translations:', missing);
  }
}

boot().catch((err) => {
  console.error('[stayfolk] boot failed', err);
  route();
});

// expose a tiny debug handle for the smoke test
window.__stayfolk = { store, route, HOSTS };
