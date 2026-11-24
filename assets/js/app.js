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
      <span>${esc(langMeta(getLang()).native)}</span>
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

const memberFail = {};

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
    case 'member': {
      const id = segs[1];
      const data = store.cachedMember(id);
      if (!store.currentUser()) { html = V.authView('login'); title = 'StayFolk'; break; }
      if (data) html = V.memberView(id, data);
      else if (memberFail[id]) html = V.notFoundView();
      else {
        html = V.memberView(id, null);
        store.fetchMember(id).then(() => route()).catch(() => { memberFail[id] = true; route(); });
      }
      title = `${data ? data.member.name : 'StayFolk'} — StayFolk`;
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
      openModal(V.reportModal(el.dataset.id, el.dataset.name || '', el.dataset.type || 'host'));
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
      if (el.dataset.kind === 'gallery') await store.removeGalleryPhoto(el.dataset.host, Number(el.dataset.index));
      else await store.clearPhoto(el.dataset.host, el.dataset.kind);
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
    case 'view-photo': {
      openModal(`<div class="modal-backdrop" data-action="close-modal" style="display:grid;place-items:center"><img src="${esc(el.dataset.src)}" alt="" style="max-width:94vw;max-height:88vh;border-radius:14px" /></div>`);
      break;
    }
    case 'onb-next': { onbGo(onbIndex + 1); break; }
    case 'onb-skip': { closeOnboarding(); break; }
    case 'onb-go': { closeOnboarding(); go(el.dataset.to || '/'); break; }
    case 'cancel-request': {
      if (!confirm(t('dash.cancelConfirm'))) break;
      try { await store.editRequest(el.dataset.id, { status: 'cancelled' }); toast(t('dash.cancelled')); } catch (err) { toast(err.message, 'error'); }
      route();
      break;
    }
    case 'edit-request': {
      const r = store.get().requests.find((x) => x.id === el.dataset.id);
      if (r) openModal(V.editRequestModal(r));
      break;
    }
    case 'review-member': {
      openModal(V.reviewModal(el.dataset.id, el.dataset.name || ''));
      break;
    }
    case 'block-user': {
      if (!confirm(t('msg.blockConfirm'))) break;
      try { await store.blockUser(el.dataset.id, true); toast(t('msg.block')); } catch (err) { toast(err.message, 'error'); }
      go('/dashboard/settings');
      break;
    }
    case 'unblock-user': {
      try { await store.blockUser(el.dataset.id, false); } catch (err) { toast(err.message, 'error'); }
      route();
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
  if (e.target.name === 'notify' && e.target.type === 'checkbox') {
    store.updateProfile({ notify: e.target.checked }).then(() => toast(t('profile.saved'))).catch((err) => toast(err.message, 'error'));
    return;
  }
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
    if (kind === 'gallery') await store.addGalleryPhoto(input.dataset.host, dataUrl);
    else await store.setPhoto(input.dataset.host, kind, dataUrl);
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
          availableFrom: String(fd.get('availableFrom') || ''),
          availableTo: String(fd.get('availableTo') || ''),
          tags: String(fd.get('tags') || '').split(',').map((x) => x.trim()).filter(Boolean),
          rules: String(fd.get('rules') || '').split('\n').map((x) => x.trim()).filter(Boolean),
        },
      });
      toast(t('profile.saved'));
      route();
    } catch (err) {
      toast(err.message || t('auth.invalid'), 'error');
    }
    return;
  }

  if (form.id === 'edit-request-form') {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await store.editRequest(form.dataset.id, { from: String(fd.get('from')), to: String(fd.get('to')), guests: Number(fd.get('guests')) });
      closeModal(); toast(t('profile.saved')); route();
    } catch (err) { toast(err.message, 'error'); }
    return;
  }

  if (form.id === 'review-form') {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await store.addReview({ hostId: form.dataset.id, rating: Number(fd.get('rating')), text: String(fd.get('text') || '') });
      closeModal(); toast(t('profile.saved')); route();
    } catch (err) { toast(err.message, 'error'); }
    return;
  }

  if (form.id === 'delete-account-form') {
    e.preventDefault();
    if (!confirm(t('set.deleteHint'))) return;
    try {
      await store.deleteAccount(String(new FormData(form).get('password') || ''));
      toast(t('set.delete')); go('/');
    } catch (err) { toast(err.message, 'error'); }
    return;
  }

  if (form.id === 'report-form') {
    e.preventDefault();
    const fd = new FormData(form);
    await store.addReport({
      targetType: form.dataset.type || 'host',
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

/* ------------------------------------------------ splash + onboarding */

function hideSplash() {
  const el = document.getElementById('splash');
  try { sessionStorage.setItem('sf.splash', '1'); } catch { /* private mode */ }
  if (!el) return;
  const wait = Math.max(0, 1900 - performance.now());
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 500);
  }, wait);
}

const ONB = {
  en: {
    skip: 'Skip', next: 'Next', create: 'Create account', login: 'Log in', browse: 'Browse first',
    slides: [
      ['Travel like a local', 'New places, real friendships. See the world through the eyes of the people who live there.'],
      ['Stay free with local hosts', 'Verified hosts open their homes to travelers. No fees, just good company.'],
      ['Meet fellow travelers', 'Share stories, explore the city together and find friends for life.'],
      ['Safe, free and community-run', 'Reviews, verification, block and report tools keep every stay respectful.'],
    ],
  },
  ml: {
    skip: 'ഒഴിവാക്കുക', next: 'അടുത്തത്', create: 'അക്കൗണ്ട് ഉണ്ടാക്കൂ', login: 'ലോഗിൻ', browse: 'ആദ്യം ചുറ്റിനോക്കാം',
    slides: [
      ['നാട്ടുകാരനെപ്പോലെ യാത്ര ചെയ്യൂ', 'പുതിയ നാടുകൾ, യഥാർത്ഥ സൗഹൃദങ്ങൾ. അവിടെ ജീവിക്കുന്നവരുടെ കണ്ണിലൂടെ ലോകം കാണൂ.'],
      ['ലോക്കൽ ഹോസ്റ്റിനൊപ്പം സൗജന്യ താമസം', 'വെരിഫൈ ചെയ്ത ഹോസ്റ്റുകൾ യാത്രക്കാരെ വീട്ടിലേക്ക് സ്വാഗതം ചെയ്യുന്നു. ഫീസില്ല, നല്ല കൂട്ട് മാത്രം.'],
      ['സഹയാത്രികരെ കണ്ടുമുട്ടൂ', 'കഥകൾ പങ്കിടൂ, നഗരം ഒരുമിച്ച് ചുറ്റൂ, ജീവിതകാലം നീളുന്ന സുഹൃത്തുക്കളെ കണ്ടെത്തൂ.'],
      ['സുരക്ഷിതം, സൗജന്യം, കമ്മ്യൂണിറ്റി നടത്തുന്നത്', 'റിവ്യൂ, വെരിഫിക്കേഷൻ, ബ്ലോക്ക്, റിപ്പോർട്ട് എന്നിവ ഓരോ താമസവും ബഹുമാനത്തോടെ ആക്കുന്നു.'],
    ],
  },
};

const ONB_ART = [
  '<svg viewBox="0 0 320 220" role="img" aria-label=""><rect width="320" height="220" rx="24" fill="#DCE8FF"/><circle cx="252" cy="58" r="26" fill="#FFC857"/><path d="M0 170 80 78l52 62 40-46 148 126z" fill="#7AA5FB"/><path d="M0 192 62 130l58 50 72-62 128 102z" fill="#3A79F7"/><path d="M0 220v-28c60-20 120-10 180 0s100 10 140-6v34z" fill="#2FB67C"/><circle cx="150" cy="146" r="10" fill="#1B2A4A"/><rect x="140" y="156" width="20" height="34" rx="9" fill="#1B2A4A"/><rect x="129" y="160" width="14" height="24" rx="6" fill="#FF7A59"/><path d="M215 60c10-8 20-8 30 0M232 44c8-6 16-6 24 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 320 220" role="img" aria-label=""><rect width="320" height="220" rx="24" fill="#FFE9D6"/><circle cx="60" cy="52" r="22" fill="#FFC857"/><path d="M76 112 160 46l84 66z" fill="#FF7A59"/><rect x="94" y="112" width="132" height="78" fill="#fff"/><rect x="146" y="138" width="30" height="52" rx="4" fill="#3A79F7"/><rect x="106" y="128" width="28" height="24" rx="3" fill="#DCE8FF"/><rect x="186" y="128" width="28" height="24" rx="3" fill="#DCE8FF"/><path d="M160 100c-12-9-18-16-12-22 4-4 10-2 12 3 2-5 8-7 12-3 6 6 0 13-12 22z" fill="#fff"/><path d="M0 220v-30c70-14 130-8 190 0s90 6 130-4v34z" fill="#2FB67C"/></svg>',
  '<svg viewBox="0 0 320 220" role="img" aria-label=""><rect width="320" height="220" rx="24" fill="#DDF5EA"/><circle cx="110" cy="120" r="16" fill="#1B2A4A"/><rect x="92" y="138" width="36" height="52" rx="16" fill="#3A79F7"/><circle cx="210" cy="120" r="16" fill="#1B2A4A"/><rect x="192" y="138" width="36" height="52" rx="16" fill="#FF7A59"/><rect x="60" y="40" width="96" height="44" rx="14" fill="#fff"/><path d="M90 84l-8 14 22-14z" fill="#fff"/><rect x="170" y="62" width="92" height="40" rx="14" fill="#3A79F7"/><path d="M236 102l10 14-24-14z" fill="#3A79F7"/><circle cx="82" cy="62" r="4" fill="#7AA5FB"/><circle cx="108" cy="62" r="4" fill="#7AA5FB"/><circle cx="134" cy="62" r="4" fill="#7AA5FB"/><path d="M0 220v-24h320v24z" fill="#2FB67C"/></svg>',
  '<svg viewBox="0 0 320 220" role="img" aria-label=""><rect width="320" height="220" rx="24" fill="#E8E4FF"/><path d="M160 30 232 58v54c0 42-30 64-72 80-42-16-72-38-72-80V58z" fill="#3A79F7"/><path d="M122 112l26 26 50-56" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="64" r="6" fill="#FFC857"/><circle cx="262" cy="150" r="8" fill="#FF7A59"/><circle cx="248" cy="46" r="5" fill="#2FB67C"/></svg>',
];

let onbIndex = 0;

function onboardingSeen() {
  try { return localStorage.getItem('stayfolk.onboarded') === '1'; } catch { return true; }
}

function onbRender() {
  const L = ONB[getLang()] || ONB.en;
  const last = onbIndex === L.slides.length - 1;
  const [title, text] = L.slides[onbIndex];
  return `
  <div class="onb__top"><span class="onb__brand">${BRAND_MARK}<span>StayFolk</span></span>
    ${last ? '' : `<button class="btn btn--ghost btn--sm" data-action="onb-skip">${esc(L.skip)}</button>`}</div>
  <div class="onb__art" key="${onbIndex}">${ONB_ART[onbIndex]}</div>
  <div class="onb__body">
    <h2>${esc(title)}</h2>
    <p>${esc(text)}</p>
    <div class="onb__dots">${L.slides.map((_, i) => `<span class="${i === onbIndex ? 'is-on' : ''}"></span>`).join('')}</div>
  </div>
  <div class="onb__actions">
    ${last
      ? `<a class="btn btn--primary btn--block" href="#/signup" data-action="onb-go" data-to="/signup">${esc(L.create)}</a>
         <a class="btn btn--outline btn--block" href="#/login" data-action="onb-go" data-to="/login">${esc(L.login)}</a>
         <button class="btn btn--ghost btn--block" data-action="onb-skip">${esc(L.browse)}</button>`
      : `<button class="btn btn--primary btn--block" data-action="onb-next">${esc(L.next)}</button>`}
  </div>`;
}

function onbGo(i) {
  const L = ONB[getLang()] || ONB.en;
  onbIndex = Math.max(0, Math.min(L.slides.length - 1, i));
  const el = document.getElementById('onboard');
  if (el) el.innerHTML = onbRender();
}

function showOnboarding() {
  if (document.getElementById('onboard')) return;
  onbIndex = 0;
  const el = document.createElement('div');
  el.id = 'onboard';
  el.className = 'onb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = onbRender();
  document.body.appendChild(el);
}

function closeOnboarding() {
  try { localStorage.setItem('stayfolk.onboarded', '1'); } catch { /* ignore */ }
  const el = document.getElementById('onboard');
  if (el) { el.classList.add('is-out'); setTimeout(() => el.remove(), 300); }
}

async function boot() {
  await store.init();

  const s = store.get();
  setLang(s.lang || 'en');
  applyLanguage();
  document.documentElement.dataset.theme = s.theme || 'light';

  if (!location.hash) location.hash = '#/';
  route();
  hideSplash();
  if (!store.currentUser() && !onboardingSeen() && !['login', 'signup', 'forgot', 'reset', 'verify'].includes(currentPath())) showOnboarding();
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
