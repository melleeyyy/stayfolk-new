/**
 * StayFolk — views.
 * Pure functions that return HTML strings. The router in app.js swaps them in
 * and handles every interaction through delegated events.
 */

import { t, getLang, LANGS } from './i18n.js';
import { CITIES, STATS, LANGUAGES, cityBySlug, reviewsFor, referencesFor } from './data.js';
import { cover, avatar } from './media.js';
import * as store from './store.js';

const hostById = (id) => store.hostById(id);
const allHosts = () => store.hosts();

/** "Kochi, India" — works for seed hosts and for members who host. */
const placeOf = (host) => {
  const city = host.citySlug ? cityBySlug(host.citySlug) : null;
  const name = host.cityName || (city ? city.name : '');
  const country = host.country || (city ? city.country : '');
  return [name, country].filter(Boolean).join(', ');
};

/* ------------------------------------------------------------- utilities */

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 8.3 7.5 9 4.3-.7 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  message: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowBack: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  flag: '<path d="M5 21V4h9l-1 3h6l-1 4 1 4h-6l-1-3H5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  logout: '<path d="M15 17l5-5-5-5"/><path d="M20 12H9"/><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  bed: '<path d="M3 18v-6h18v6"/><path d="M3 18v2M21 18v2M6 12V8h5v4"/>',
};

export function icon(name, cls = '') {
  // width/height are attributes so an icon can never inherit a container width;
  // CSS rules with a selector still override them where a different size is needed.
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    class="icon ${cls}" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

const stars = (rating) =>
  `<span class="rating">${icon('star')}${Number(rating).toFixed(1)}</span>`;

/* Uploaded photos override the generated artwork when a host has added one. */
const coverFor = (host, w, h) => store.photoFor(host.id, 'cover') || cover('cover-' + host.id, w, h);
const avatarFor = (host, cls = '') =>
  `<img class="avatar ${cls}" src="${store.photoFor(host.id, 'avatar') || avatar(host.name, host.id)}" alt="${esc(host.name)}" />`;

function accentTitle(str) {
  let i = 0;
  return esc(str)
    .split('|')
    .map((part) => {
      if (!part) return '';
      if (i++ % 2 === 0) return part;
      return `<span class="${i % 4 === 2 ? 'accent' : 'accent-2'}">${part}</span>`;
    })
    .join('');
}

const badge = (kind, label, ic) =>
  `<span class="badge badge--${kind}">${ic ? icon(ic) : ''}${esc(label)}</span>`;

/* -------------------------------------------------------------- fragments */

export function hostCard(host) {
  return `
  <a class="host-card" href="#/host/${host.id}">
    <div class="host-card__media">
      <img src="${coverFor(host, 800, 600)}" alt="" loading="lazy" width="800" height="600" />
      <div class="host-card__badges">
        ${host.verified ? `<span class="badge badge--glass">${icon('shield')}${esc(t('host.verified'))}</span>` : ''}
        ${host.womenOnly ? `<span class="badge badge--glass">${esc(t('host.women'))}</span>` : ''}
      </div>
    </div>
    <div class="host-card__body">
      <div class="host-card__top">
        <span class="host-card__name">${esc(host.name)}</span>
        ${stars(host.rating)}
      </div>
      <span class="host-card__place">${icon('pin')}${esc(placeOf(host))}</span>
      <p class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
        ${esc(host.space)} · ${esc(host.languages.slice(0, 2).join(', '))}
      </p>
      <div class="host-card__meta">
        <span>${esc(t('host.response'))}: <strong>${host.responseRate}%</strong></span>
        <span class="spacer"></span>
        <span>${host.reviewCount} ${esc(t('host.reviews').toLowerCase())}</span>
      </div>
    </div>
  </a>`;
}

export function cityCard(city) {
  const n = allHosts().filter((h) => h.citySlug === city.slug).length;
  return `
  <a class="city-card" href="#/city/${city.slug}">
    <span class="city-card__img"><img src="${cover('city-' + city.slug, 600, 750)}" alt="" loading="lazy" /></span>
    <span>
      <span class="city-card__name" style="display:block">${esc(city.name)}</span>
      <span class="city-card__meta">${esc(city.country)} · ${t('cities.hosts', { n })}</span>
    </span>
  </a>`;
}

const empty = (title, text, ic = 'search') => `
  <div class="empty">
    ${icon(ic)}
    <h4>${esc(title)}</h4>
    <p>${esc(text)}</p>
  </div>`;

/* ------------------------------------------------------------------ home */

export function homeView() {
  const featured = ['h1', 'h4', 'h11', 'h9', 'h15', 'h7', 'h14', 'h17'].map((id) => hostById(id)).filter(Boolean);
  const cityOrder = ['kochi', 'lisbon', 'tokyo', 'barcelona', 'bangkok', 'mexico-city', 'berlin', 'jaipur', 'seoul', 'cape-town', 'istanbul', 'paris'];
  const cities = cityOrder.map(cityBySlug).filter(Boolean);

  return `
  <section class="hero">
    <div class="container hero__inner">
      <span class="eyebrow">${icon('spark')}${esc(t('hero.eyebrow'))}</span>
      <h1>${accentTitle(t('hero.title'))}</h1>
      <p class="lede">${esc(t('hero.sub'))}</p>

      <form class="searchbar" id="hero-search" role="search">
        <div class="searchbar__field">
          <label for="q-city">${esc(t('hero.city'))}</label>
          <input id="q-city" name="city" list="city-list" placeholder="${esc(t('hero.cityPlaceholder'))}" autocomplete="off" />
          <datalist id="city-list">
            ${CITIES.map((c) => `<option value="${esc(c.name)}">${esc(c.country)}</option>`).join('')}
          </datalist>
        </div>
        <div class="searchbar__field">
          <label for="q-date">${esc(t('hero.when'))}</label>
          <input id="q-date" name="date" type="date" />
        </div>
        <div class="searchbar__field">
          <label for="q-guests">${esc(t('hero.guests'))}</label>
          <select id="q-guests" name="guests">
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4+</option>
          </select>
        </div>
        <button class="btn btn--primary" type="submit">${icon('search')}${esc(t('hero.search'))}</button>
      </form>

      <p class="small muted">${esc(t('hero.note'))}</p>

      <div class="hero-stats">
        <div class="hero-stats__item"><span class="hero-stats__num">${STATS.hosts.toLocaleString()}</span><span class="hero-stats__label">${esc(t('stats.hosts'))}</span></div>
        <div class="hero-stats__item"><span class="hero-stats__num">${STATS.cities}</span><span class="hero-stats__label">${esc(t('stats.cities'))}</span></div>
        <div class="hero-stats__item"><span class="hero-stats__num">${STATS.countries}</span><span class="hero-stats__label">${esc(t('stats.countries'))}</span></div>
        <div class="hero-stats__item"><span class="hero-stats__num">${(STATS.stays / 1000).toFixed(0)}k</span><span class="hero-stats__label">${esc(t('stats.stays'))}</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <div class="section-head__text">
          <h2>${esc(t('how.title'))}</h2>
          <p class="lede">${esc(t('how.sub'))}</p>
        </div>
        <a class="btn btn--outline" href="#/explore">${esc(t('featured.all'))}${icon('arrow')}</a>
      </div>
      <div class="steps">
        ${[1, 2, 3, 4].map((n) => `
          <div class="step">
            <div class="step__num">${n}</div>
            <h4>${esc(t(`how.s${n}t`))}</h4>
            <p>${esc(t(`how.s${n}d`))}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <div class="section-head__text">
          <h2>${esc(t('featured.title'))}</h2>
          <p class="lede">${esc(t('featured.sub'))}</p>
        </div>
        <a class="btn btn--outline" href="#/explore">${esc(t('featured.all'))}${icon('arrow')}</a>
      </div>
      <div class="grid grid--hosts">${featured.map(hostCard).join('')}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <div class="section-head__text">
          <h2>${esc(t('homecities.title'))}</h2>
          <p class="lede">${esc(t('homecities.sub'))}</p>
        </div>
        <a class="btn btn--outline" href="#/cities">${esc(t('nav.cities'))}${icon('arrow')}</a>
      </div>
      <div class="grid grid--cities">${cities.map(cityCard).join('')}</div>
    </div>
  </section>

  <section class="section section--ink">
    <div class="container">
      <div class="section-head">
        <div class="section-head__text">
          <h2>${esc(t('trust.title'))}</h2>
          <p class="lede">${esc(t('trust.sub'))}</p>
        </div>
      </div>
      <div class="trust-grid">
        ${[1, 2, 3].map((n) => `
          <div class="trust-card">
            <h4><span class="trust-icon">${icon(n === 1 ? 'shield' : n === 2 ? 'users' : 'star')}</span>${esc(t(`trust.${n}t`))}</h4>
            <p>${esc(t(`trust.${n}d`))}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="cta-band">
        <h2>${esc(t('cta.title'))}</h2>
        <p>${esc(t('cta.sub'))}</p>
        <div class="row row--wrap" style="margin-top:8px">
          <a class="btn btn--green btn--lg" href="#/signup">${esc(t('cta.host'))}</a>
          <a class="btn btn--lg" style="background:#fff;color:#000" href="#/explore">${esc(t('cta.guest'))}</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- explore */

export function exploreView(q = {}) {
  const { city = '', guests = '', language = '', verified = false, women = false, sort = 'rating' } = q;
  let list = allHosts().slice();
  if (city) {
    const needle = city.toLowerCase().trim();
    list = list.filter((h) => placeOf(h).toLowerCase().includes(needle));
  }
  if (language) list = list.filter((h) => h.languages.includes(language));
  if (verified) list = list.filter((h) => h.verified);
  if (women) list = list.filter((h) => h.womenOnly);
  if (guests) list = list.filter((h) => h.maxGuests >= Number(guests));

  if (sort === 'new') list.sort((a, b) => (a.joined < b.joined ? 1 : -1));
  else if (sort === 'response') list.sort((a, b) => b.responseRate - a.responseRate);
  else list.sort((a, b) => b.rating - a.rating);

  return `
  <div class="page-head">
    <div class="container">
      <h1>${esc(t('search.title'))}</h1>
      <p class="lede">${esc(t('search.noneHint'))}</p>
    </div>
  </div>

  <div class="container search-layout">
    <aside class="filters" aria-label="${esc(t('search.filters'))}">
      <div class="row row--between">
        <h3>${esc(t('search.filters'))}</h3>
        <button class="btn btn--ghost btn--sm" data-action="clear-filters">${esc(t('search.clear'))}</button>
      </div>
      <form id="filters-form" class="stack" style="gap:18px">
        <div class="filter-group">
          <label class="label" for="f-city">${esc(t('search.where'))}</label>
          <input class="input" id="f-city" name="city" value="${esc(city)}" list="city-list-2" placeholder="${esc(t('search.all'))}" />
          <datalist id="city-list-2">
            ${CITIES.map((c) => `<option value="${esc(c.name)}"></option>`).join('')}
          </datalist>
        </div>
        <div class="filter-group">
          <label class="label" for="f-guests">${esc(t('search.guests'))}</label>
          <select class="select" id="f-guests" name="guests">
            <option value="">—</option>
            ${[1, 2, 3].map((n) => `<option value="${n}" ${String(guests) === String(n) ? 'selected' : ''}>${n}+</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="label" for="f-lang">${esc(t('search.language'))}</label>
          <select class="select" id="f-lang" name="language">
            <option value="">${esc(t('search.anyLanguage'))}</option>
            ${LANGUAGES.map((l) => `<option value="${esc(l)}" ${language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="check"><input type="checkbox" name="verified" ${verified ? 'checked' : ''} />${esc(t('search.verified'))}</label>
          <label class="check"><input type="checkbox" name="women" ${women ? 'checked' : ''} />${esc(t('search.women'))}</label>
        </div>
        <input type="hidden" name="sort" value="${esc(sort)}" />
      </form>
    </aside>

    <div>
      <div class="results-head">
        <p class="small muted" style="margin:0">${esc(t('search.results', { n: list.length }))}</p>
        <label class="row" style="gap:8px">
          <span class="tiny muted">${esc(t('search.sort'))}</span>
          <select class="select" id="sort-select" aria-label="${esc(t('search.sort'))}"
            style="height:38px;width:auto;min-width:168px;font-size:.88rem">
            <option value="rating" ${sort === 'rating' ? 'selected' : ''}>${esc(t('search.sortRating'))}</option>
            <option value="response" ${sort === 'response' ? 'selected' : ''}>${esc(t('search.sortResponse'))}</option>
            <option value="new" ${sort === 'new' ? 'selected' : ''}>${esc(t('search.sortNew'))}</option>
          </select>
        </label>
      </div>
      ${list.length
        ? `<div class="grid grid--hosts">${list.map(hostCard).join('')}</div>`
        : empty(t('search.none'), t('search.noneHint'))}
    </div>
  </div>`;
}

/* --------------------------------------------------------------- profile */

export function hostView(id) {
  const host = hostById(id);
  if (!host) return notFoundView();
  const place = placeOf(host);
  const reviews = [...store.get().reviews.filter((r) => r.hostId === id), ...reviewsFor(id)];
  const refs = referencesFor(id);
  const nearby = allHosts()
    .filter((h) => h.id !== host.id && placeOf(h) && placeOf(h) === place)
    .slice(0, 3);
  const user = store.currentUser();

  return `
  <div class="container profile-hero">
    <div class="breadcrumb">
      <a href="#/explore">${esc(t('nav.explore'))}</a>${icon('chevron')}
      ${host.citySlug ? `<a href="#/city/${host.citySlug}">${esc(placeOf(host))}</a>${icon('chevron')}` : `<span>${esc(placeOf(host))}</span>${icon('chevron')}`}
      <span>${esc(host.name)}</span>
    </div>
    <div class="profile-cover"><img src="${coverFor(host, 1200, 400)}" alt="" /></div>
    <div class="profile-head">
      ${avatarFor(host, 'avatar--xl')}
      <div style="flex:1;min-width:200px;padding-bottom:8px">
        <h1 style="font-size:clamp(1.6rem,3vw,2.1rem);margin-bottom:8px">${esc(host.name)}</h1>
        <div class="row row--wrap" style="gap:8px">
          ${host.verified ? badge('verified', t('host.verified'), 'shield') : badge('', t('host.unverified'), 'lock')}
          ${host.womenOnly ? badge('women', t('host.women'), 'users') : ''}
          <span class="badge">${icon('pin')}${esc(place)}</span>
          <span class="badge">${icon('star')}${host.rating} · ${host.reviewCount}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="container profile-layout">
    <div class="stack" style="gap:32px">
      <section class="card">
        <h3 style="margin-bottom:10px">${esc(t('host.about'))}</h3>
        <p style="line-height:1.75">${esc(host.bio)}</p>
        <div class="chips" style="margin-top:16px">
          ${host.tags.map((tag) => `<span class="chip">${esc(tag)}</span>`).join('')}
        </div>
      </section>

      <section class="card">
        <h3 style="margin-bottom:18px">${esc(t('host.room'))}</h3>
        <div class="detail-list">
          <div class="detail-row">${icon('bed')}<div><div class="detail-row__label">${esc(t('host.room'))}</div><div class="detail-row__value">${esc(host.space)}</div></div></div>
          <div class="detail-row">${icon('users')}<div><div class="detail-row__label">${esc(t('host.guests', { n: host.maxGuests }))}</div><div class="detail-row__value">${host.maxGuests === 1 ? '1' : `1–${host.maxGuests}`}</div></div></div>
          <div class="detail-row">${icon('globe')}<div><div class="detail-row__label">${esc(t('host.speaks'))}</div><div class="detail-row__value">${esc(host.languages.join(' · '))}</div></div></div>
          <div class="detail-row">${icon('message')}<div><div class="detail-row__label">${esc(t('host.response'))}</div><div class="detail-row__value">${host.responseRate}%</div></div></div>
          <div class="detail-row">${icon('calendar')}<div><div class="detail-row__label">${esc(t('host.member'))}</div><div class="detail-row__value">${esc(host.joined)}</div></div></div>
        </div>
        <hr class="divider" />
        <h4 style="margin-bottom:10px">${esc(t('host.rules'))}</h4>
        <ul class="stack" style="gap:8px">
          ${host.rules.map((r) => `<li class="row small" style="align-items:flex-start;gap:9px">${icon('check')}<span>${esc(r)}</span></li>`).join('')}
        </ul>
      </section>

      <section class="card">
        <h3 style="margin-bottom:16px">${esc(t('host.references'))} <span class="muted small">(${refs.length})</span></h3>
        <div class="grid" style="gap:12px">
          ${refs.length ? refs.map((r) => `
            <div class="reference">
              <div class="row"><img class="avatar avatar--sm" src="${avatar(r.author, r.author)}" alt="" />
                <strong class="small">${esc(r.author)}</strong><span class="tiny muted">${esc(r.relation)}</span></div>
              <p class="reference__text">“${esc(r.text)}”</p>
            </div>`).join('') : `<p class="small muted">—</p>`}
        </div>
      </section>

      <section class="card">
        <h3 style="margin-bottom:8px">${esc(t('host.reviews'))} <span class="muted small">(${reviews.length})</span></h3>
        ${reviews.length ? reviews.map((r) => `
          <div class="review">
            <div class="review__head">
              <img class="avatar avatar--sm" src="${avatar(r.author, r.author)}" alt="" />
              <span class="review__name">${esc(r.author)}</span>
              <span class="review__date">${esc(r.date)}</span>
              <span class="spacer"></span>${stars(r.rating)}
            </div>
            <p class="review__text">${esc(r.text)}</p>
          </div>`).join('') : `<p class="small muted">—</p>`}
      </section>

      ${nearby.length ? `
      <section>
        <h3 style="margin-bottom:16px">${esc(t('host.similar'))}</h3>
        <div class="grid grid--hosts">${nearby.map(hostCard).join('')}</div>
      </section>` : ''}
    </div>

    <aside class="profile-side">
      <div class="card">
        <div class="row row--between" style="margin-bottom:14px">
          <div>
            <div class="muted tiny">${esc(t('host.room'))}</div>
            <strong>${esc(host.space)}</strong>
          </div>
          ${stars(host.rating)}
        </div>
        <button class="btn btn--primary btn--block btn--lg" data-action="open-request" data-id="${host.id}">
          ${icon('calendar')}${esc(t('host.request'))}
        </button>
        <p class="tiny muted" style="margin-top:12px;text-align:center">${esc(t('hero.note'))}</p>
        <hr class="divider" />
        <div class="row" style="gap:8px">
          <button class="btn btn--outline btn--sm" style="flex:1" data-action="copy-link">${esc(t('common.copy'))}</button>
          <button class="btn btn--outline btn--sm" style="flex:1" data-action="report" data-id="${host.id}" data-name="${esc(host.name)}">${icon('flag')}${esc(t('admin.reports'))}</button>
        </div>
      </div>
      <div class="card card--flat" style="background:var(--surface-2)">
        <div class="row" style="gap:10px;align-items:flex-start">
          ${icon('shield')}
          <p class="small" style="margin:0">${esc(t('trust.sub'))}</p>
        </div>
      </div>
      ${!user ? `<div class="card card--flat"><p class="small muted">${esc(t('req.login'))}</p><a class="btn btn--ink btn--sm btn--block" style="margin-top:10px" href="#/login">${esc(t('nav.login'))}</a></div>` : ''}
    </aside>
  </div>`;
}

/* ----------------------------------------------------------------- cities */

export function citiesView() {
  return `
  <div class="page-head"><div class="container">
    <h1>${esc(t('cities.title'))}</h1>
    <p class="lede">${esc(t('cities.sub'))}</p>
  </div></div>
  <div class="container section--tight">
    <div class="grid grid--cities">${CITIES.map(cityCard).join('')}</div>
  </div>`;
}

export function cityView(slug) {
  const city = cityBySlug(slug);
  if (!city) return notFoundView();
  const hosts = allHosts().filter((h) => h.citySlug === slug);
  return `
  <div class="page-head"><div class="container">
    <div class="breadcrumb"><a href="#/cities">${esc(t('nav.cities'))}</a>${icon('chevron')}<span>${esc(city.name)}</span></div>
    <h1>${esc(city.name)}</h1>
    <p class="lede">${esc(city.blurb)}</p>
    <p class="small muted" style="margin-top:8px">${esc(city.region)} · ${esc(city.country)} · ${esc(t('cities.hosts', { n: hosts.length }))}</p>
  </div></div>
  <div class="container section--tight">
    ${hosts.length ? `<div class="grid grid--hosts">${hosts.map(hostCard).join('')}</div>` : empty(t('search.none'), t('search.noneHint'))}
  </div>`;
}

/* -------------------------------------------------------------- static pages */

export function howView() {
  return `
  <div class="page-head"><div class="container">
    <h1>${esc(t('how.title'))}</h1>
    <p class="lede">${esc(t('how.sub'))}</p>
  </div></div>
  <div class="container section--tight">
    <div class="steps">
      ${[1, 2, 3, 4].map((n) => `<div class="step"><div class="step__num">${n}</div><h4>${esc(t(`how.s${n}t`))}</h4><p>${esc(t(`how.s${n}d`))}</p></div>`).join('')}
    </div>
    <div class="grid grid--3" style="margin-top:40px">
      ${[1, 2, 3].map((n) => `
        <div class="card">
          <h4 style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span class="trust-icon" style="background:var(--blue-050);color:var(--blue)">${icon(n === 1 ? 'shield' : n === 2 ? 'users' : 'star')}</span>${esc(t(`trust.${n}t`))}</h4>
          <p class="small">${esc(t(`trust.${n}d`))}</p>
        </div>`).join('')}
    </div>
  </div>`;
}

export function safetyView() {
  return `
  <div class="page-head"><div class="container">
    <h1>${esc(t('safety.title'))}</h1>
    <p class="lede">${esc(t('safety.sub'))}</p>
  </div></div>
  <div class="container section--tight">
    <div class="grid grid--2">
      <div class="card">
        <h3 style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${icon('eye')}${esc(t('how.s3t'))}</h3>
        <p class="small">${esc(t('how.s3d'))}</p>
      </div>
      <div class="card">
        <h3 style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${icon('shield')}${esc(t('trust.1t'))}</h3>
        <p class="small">${esc(t('trust.1d'))}</p>
      </div>
      <div class="card">
        <h3 style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${icon('flag')}${esc(t('admin.reports'))}</h3>
        <p class="small">${esc(t('trust.sub'))}</p>
      </div>
      <div class="card" style="border-color:#F3C7C3;background:#FEF3F2">
        <h3 style="display:flex;gap:10px;align-items:center;margin-bottom:10px;color:#B42318">${icon('lock')}${esc(t('safety.emergency'))}</h3>
        <p class="small" style="color:#7A2A22">${esc(t('safety.emergencyText'))}</p>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------- auth */

export function authView(mode = 'login') {
  const isLogin = mode === 'login';
  return `
  <div class="auth-shell">
    <aside class="auth-aside">
      <div>
        <span class="eyebrow eyebrow--green" style="background:rgba(92,196,60,.14);border-color:rgba(92,196,60,.3);color:#A6E58D">${icon('spark')}${esc(t('hero.eyebrow'))}</span>
      </div>
      <div style="display:grid;gap:14px">
        <h2>${esc(t('cta.title'))}</h2>
        <p>${esc(t('cta.sub'))}</p>
      </div>
      <p class="tiny" style="color:rgba(255,255,255,.45)">${esc(t('footer.rights'))}</p>
    </aside>

    <div class="auth-main">
      <form class="auth-form" id="auth-form" data-mode="${isLogin ? 'login' : 'signup'}" novalidate>
        <div>
          <h1>${esc(isLogin ? t('auth.loginTitle') : t('auth.signupTitle'))}</h1>
          <p class="small muted" style="margin-top:6px">${esc(isLogin ? t('auth.loginSub') : t('auth.signupSub'))}</p>
        </div>

        ${!isLogin ? `
        <div class="field"><label for="a-name">${esc(t('auth.name'))}</label>
          <input class="input" id="a-name" name="name" required autocomplete="name" /></div>

        <div class="field"><label for="a-username">${esc(t('auth.username'))}</label>
          <input class="input" id="a-username" name="username" required autocomplete="username"
            pattern="[a-z0-9_]{3,20}" placeholder="anjali_nair" />
          <span class="tiny muted">${esc(t('auth.usernameHint'))}</span></div>

        <div class="field"><label for="a-city">${esc(t('auth.city'))}</label>
          <input class="input" id="a-city" name="city" autocomplete="address-level2" /></div>

        <div class="field"><label for="a-photo">${esc(t('auth.photoOptional'))}</label>
          <div class="row" style="gap:10px">
            <img class="avatar" id="a-photo-preview" src="${avatar('?', 'new-user')}" alt="" />
            <label class="btn btn--outline btn--sm file-btn">
              ${icon('plus')}${esc(t('upload.change'))}
              <input type="file" id="a-photo" accept="image/*" />
            </label>
          </div></div>` : ''}

        <div class="field"><label for="a-email">${esc(t('auth.email'))}</label>
          <input class="input" id="a-email" name="email" type="${isLogin ? 'text' : 'email'}" required
            autocomplete="${isLogin ? 'username' : 'email'}"
            placeholder="${isLogin ? 'you@example.com · anjali_nair' : 'you@example.com'}" /></div>

        <div class="field"><label for="a-pass">${esc(t('auth.password'))}</label>
          <input class="input" id="a-pass" name="password" type="password" required
            autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="••••••••" />
          ${!isLogin ? `<span class="tiny muted">${esc(t('auth.passwordHint'))}</span>` : ''}</div>

        <p class="field-error" id="auth-error" hidden></p>

        <button class="btn btn--primary btn--lg btn--block" type="submit">
          ${esc(isLogin ? t('auth.login') : t('auth.signup'))}
        </button>

        <p class="small muted text-center">
          <a class="link" href="#/${isLogin ? 'signup' : 'login'}">${esc(isLogin ? t('auth.toSignup') : t('auth.toLogin'))}</a>
        </p>

        ${isLogin ? `<p class="small text-center" style="margin:0">
          <a class="link" href="#/forgot">${esc(t('auth.forgot'))}</a></p>` : ''}

        ${!store.isRemote() ? `
        <div class="auth-demo">
          <strong style="color:var(--text)">${esc(t('auth.demo'))}</strong>
          <div>${esc(t('nav.dashboard'))}: <code>host@stayfolk.demo</code> / <code>demo1234</code></div>
          <div>${esc(t('nav.admin'))}: <code>admin@stayfolk.demo</code> / <code>demo1234</code></div>
          <div>${esc(t('nav.explore'))}: <code>guest@stayfolk.demo</code> / <code>demo1234</code></div>
        </div>` : ''}
      </form>
    </div>
  </div>`;
}

/* ----------------------------------------------------- verify / reset */

const simplePage = (title, text, cta, href) => `
  <div class="container section" style="max-width:560px;text-align:center">
    <h1 style="font-size:1.7rem;margin-bottom:12px">${esc(title)}</h1>
    <p class="lede" style="margin-bottom:26px">${esc(text)}</p>
    ${cta ? `<a class="btn btn--primary" href="${href}">${esc(cta)}</a>` : ''}
  </div>`;

export function verifyView(state = {}) {
  if (state.status === 'ok') return simplePage(t('auth.verifyOk'), t('auth.verifyTitle'), t('nav.home'), '#/');
  if (state.status === 'error') return simplePage(t('auth.verifyFail'), state.message || '', t('nav.home'), '#/');
  return simplePage(t('auth.verifyChecking'), t('auth.verifyTitle'), '', '');
}

export function forgotView() {
  return `
  <div class="auth-shell" style="grid-template-columns:1fr">
    <div class="auth-main">
      <form class="auth-form" id="forgot-form">
        <h1 style="font-size:1.6rem">${esc(t('auth.forgot'))}</h1>
        <p class="small muted">${esc(t('auth.resetSent'))}</p>
        <div class="field"><label for="f-email">${esc(t('auth.email'))}</label>
          <input class="input" id="f-email" name="email" required autocomplete="username" /></div>
        <button class="btn btn--primary btn--lg btn--block" type="submit">${esc(t('auth.forgot'))}</button>
        <p class="small muted text-center"><a class="link" href="#/login">${esc(t('auth.toLogin'))}</a></p>
      </form>
    </div>
  </div>`;
}

export function resetView(token) {
  if (!token) return simplePage(t('auth.verifyFail'), '', t('nav.home'), '#/');
  return `
  <div class="auth-shell" style="grid-template-columns:1fr">
    <div class="auth-main">
      <form class="auth-form" id="reset-form" data-token="${esc(token)}">
        <h1 style="font-size:1.6rem">${esc(t('auth.resetTitle'))}</h1>
        <div class="field"><label for="r-pass">${esc(t('auth.newPassword'))}</label>
          <input class="input" id="r-pass" name="password" type="password" minlength="8" required autocomplete="new-password" /></div>
        <p class="field-error" id="reset-error" hidden></p>
        <button class="btn btn--primary btn--lg btn--block" type="submit">${esc(t('auth.changePassword'))}</button>
      </form>
    </div>
  </div>`;
}

/* -------------------------------------------------------------- dashboard */

export function dashboardView(tab = 'requests') {
  const user = store.currentUser();
  if (!user) return authView('login');

  const hosting = user.hosting || { enabled: Boolean(user.hostId), space: '', maxGuests: 1, womenOnly: false };
  const hostingEnabled = Boolean(hosting.enabled);
  const myHostId = user.hostId || (hostingEnabled ? user.id : null);
  const incoming = myHostId ? store.requestsForHost(myHostId) : [];
  const outgoing = store.requestsForUser(user.id);
  const showTrips = tab === 'trips';
  const list = hostingEnabled && !showTrips ? incoming : outgoing;
  const pending = list.filter((r) => r.status === 'pending').length;
  const accepted = list.filter((r) => r.status === 'accepted').length;

  const statusBadge = (s) => {
    const map = { pending: ['pending', t('dash.pending')], accepted: ['accepted', t('dash.accepted')], declined: ['declined', t('dash.declined')] };
    const [kind, label] = map[s] || map.pending;
    return `<span class="badge badge--${kind}">${esc(label)}</span>`;
  };

  const otherParty = (r) => (hostingEnabled && !showTrips ? r.guestName : ((hostById(r.hostId) || {}).name || '—'));

  const requestRow = (r) => `
    <div class="request-item">
      <div class="request-item__head">
        <img class="avatar" src="${avatar(otherParty(r), otherParty(r))}" alt="" />
        <div style="flex:1;min-width:140px">
          <strong>${esc(otherParty(r))}</strong>
          <div class="tiny muted">${esc(r.from)} → ${esc(r.to)} · ${esc(t('req.guests'))}: ${r.guests}</div>
        </div>
        ${statusBadge(r.status)}
      </div>
      <p class="request-item__msg">${esc(r.message)}</p>
      ${hostingEnabled && !showTrips && r.status === 'pending' ? `
        <div class="request-item__actions">
          <button class="btn btn--green btn--sm" data-action="respond" data-id="${r.id}" data-status="accepted">${icon('check')}${esc(t('dash.accept'))}</button>
          <button class="btn btn--outline btn--sm" data-action="respond" data-id="${r.id}" data-status="declined">${icon('x')}${esc(t('dash.decline'))}</button>
          <button class="btn btn--ghost btn--sm" data-action="message-guest" data-id="${r.id}">${icon('message')}${esc(t('msg.title'))}</button>
        </div>` : ''}
      ${r.status === 'accepted' ? `
        <div class="request-item__actions">
          <button class="btn btn--outline btn--sm" data-action="message-guest" data-id="${r.id}">${icon('message')}${esc(t('msg.title'))}</button>
        </div>` : ''}
    </div>`;

  const avatarSrc = store.photoFor(user.id, 'avatar') || avatar(user.name, user.id);
  const coverSrc = store.photoFor(user.id, 'cover') || cover('cover-' + user.id, 900, 300);

  const profileTab = `
    <form class="card" id="profile-form" style="display:grid;gap:24px">

      <section class="form-section">
        <div class="form-section__head">
          <h4>${esc(t('dash.photos'))}</h4>
          <p class="tiny muted">${esc(t('upload.hint'))}</p>
        </div>
        <div class="uploader">
          <div class="photo-block">
            <span class="label">${esc(t('upload.cover'))}</span>
            <div class="photo-preview photo-preview--cover"><img src="${coverSrc}" alt="" /></div>
            <div class="upload-actions">
              <label class="btn btn--outline btn--sm file-btn">
                ${icon('plus')}${esc(t('upload.change'))}
                <input type="file" accept="image/*" data-photo="cover" data-host="${user.id}" />
              </label>
              ${store.photoFor(user.id, 'cover') ? `<button type="button" class="btn btn--ghost btn--sm" data-action="clear-photo" data-kind="cover" data-host="${user.id}">${esc(t('upload.remove'))}</button>` : ''}
            </div>
          </div>
          <div class="photo-block">
            <span class="label">${esc(t('upload.photo'))}</span>
            <div class="photo-preview photo-preview--avatar"><img src="${avatarSrc}" alt="" /></div>
            <div class="upload-actions">
              <label class="btn btn--outline btn--sm file-btn">
                ${icon('plus')}${esc(t('upload.change'))}
                <input type="file" accept="image/*" data-photo="avatar" data-host="${user.id}" />
              </label>
              ${store.photoFor(user.id, 'avatar') ? `<button type="button" class="btn btn--ghost btn--sm" data-action="clear-photo" data-kind="avatar" data-host="${user.id}">${esc(t('upload.remove'))}</button>` : ''}
            </div>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section__head"><h4>${esc(t('host.about'))}</h4></div>
        <div class="grid grid--2" style="gap:14px">
          <div class="field"><label for="p-name">${esc(t('auth.name'))}</label>
            <input class="input" id="p-name" name="name" value="${esc(user.name)}" required /></div>
          <div class="field"><label for="p-username">${esc(t('auth.username'))}</label>
            <input class="input" id="p-username" name="username" value="${esc(user.username || '')}"
              pattern="[a-z0-9_]{3,20}" autocomplete="username" /></div>
          <div class="field"><label for="p-city">${esc(t('auth.city'))}</label>
            <input class="input" id="p-city" name="city" value="${esc(user.city || '')}" /></div>
          <div class="field"><label for="p-langs">${esc(t('host.speaks'))}</label>
            <select class="select" id="p-langs" name="languages" multiple size="4" style="height:auto;padding:8px">
              ${LANGUAGES.map((l) => `<option value="${esc(l)}" ${(user.languages || []).includes(l) ? 'selected' : ''}>${esc(l)}</option>`).join('')}
            </select></div>
        </div>
        <div class="field"><label for="p-bio">${esc(t('host.about'))}</label>
          <textarea class="textarea" id="p-bio" name="bio">${esc(user.bio || '')}</textarea></div>
      </section>

      <section class="form-section">
        <div class="form-section__head">
          <h4>${esc(t('dash.hosting'))}</h4>
          <p class="tiny muted">${esc(t('dash.notListedHint'))}</p>
        </div>
        <label class="check"><input type="checkbox" name="hosting" ${hostingEnabled ? 'checked' : ''} />${esc(t('profile.hosting'))}</label>
        <div class="grid grid--2" style="gap:14px">
          <div class="field"><label for="p-space">${esc(t('host.room'))}</label>
            <input class="input" id="p-space" name="space" value="${esc(hosting.space || '')}" /></div>
          <div class="field"><label for="p-max">${esc(t('search.guests'))}</label>
            <select class="select" id="p-max" name="maxGuests">
              ${[1, 2, 3, 4].map((n) => `<option value="${n}" ${Number(hosting.maxGuests) === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select></div>
        </div>
        <label class="check"><input type="checkbox" name="womenOnly" ${hosting.womenOnly ? 'checked' : ''} />${esc(t('host.women'))}</label>
        <div><a class="btn btn--outline btn--sm" href="#/form-c">${icon('shield')}${esc(t('nav.formc'))}</a></div>
      </section>

      <div class="row" style="gap:8px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:20px">
        <button class="btn btn--primary" type="submit">${icon('check')}${esc(t('common.save'))}</button>
        ${myHostId ? `<a class="btn btn--ghost btn--sm" href="#/host/${user.id}">${icon('eye')}${esc(t('host.share'))}</a>` : ''}
      </div>
    </form>
`;

  const settingsTab = `
    <section class="card settings-card">
      <h4>${esc(t('set.prefs'))}</h4>
      <label class="field"><span class="label">${esc(t('nav.language'))}</span>
        <select class="select lang-pick" aria-label="${esc(t('nav.language'))}">${LANGS.map((l) => `<option value="${l.code}" ${l.code === getLang() ? 'selected' : ''}>${esc(l.native)}</option>`).join('')}</select></label>
      <div class="settings-row"><span>${esc(t('nav.theme'))}</span><button class="btn btn--outline btn--sm" type="button" data-action="toggle-theme">${icon(store.get().theme === 'dark' ? 'sun' : 'moon')}${esc(t('nav.theme'))}</button></div>
      <div class="settings-row"><span>${esc(t('pwa.install'))}</span><button class="btn btn--outline btn--sm install-btn" type="button" data-action="install-app">${icon('plus')}${esc(t('pwa.install'))}</button></div>
    </section>
    <form class="card settings-card" id="password-form" style="display:grid;gap:16px">
      <div class="form-section__head" style="padding-top:0">
        <h4>${esc(t('dash.security'))}</h4>
        <p class="tiny muted">${esc(t('auth.changePassword'))}</p>
      </div>
      <div class="grid grid--2" style="gap:14px">
        <div class="field"><label for="p-current">${esc(t('auth.currentPassword'))}</label>
          <input class="input" id="p-current" name="current" type="password" required autocomplete="current-password" /></div>
        <div class="field"><label for="p-new">${esc(t('auth.newPassword'))}</label>
          <input class="input" id="p-new" name="next" type="password" minlength="8" required autocomplete="new-password" /></div>
      </div>
      <p class="field-error" id="password-error" hidden></p>
      <div class="row row--wrap" style="gap:8px">
        <button class="btn btn--outline" type="submit">${icon('lock')}${esc(t('auth.changePassword'))}</button>
        ${store.isRemote() ? `<button class="btn btn--ghost btn--sm" type="button" data-action="test-email">${icon('message')}${esc(t('mail.test'))}</button>` : ''}
      </div>
    </form>
    <section class="card settings-card">
      <h4>${esc(t('set.account'))}</h4>
      <div class="settings-row"><span>${esc(user.email)}</span>${user.emailVerified ? `<span class="badge badge--verified">${icon('shield')}${esc(t('host.verified'))}</span>` : ''}</div>
      <div class="settings-row"><a class="btn btn--outline btn--sm" href="#/form-c">${icon('shield')}${esc(t('nav.formc'))}</a><a class="btn btn--outline btn--sm" href="#/safety">${esc(t('nav.safety'))}</a></div>
      <button class="btn btn--outline btn--block" type="button" data-action="logout">${icon('logout')}${esc(t('nav.logout'))}</button>
    </section>`;

  return `
  <div class="container dash-layout">
    <nav class="dash-nav">
      <a href="#/dashboard" class="${tab === 'requests' ? 'is-active' : ''}">${icon('message')}${esc(hostingEnabled ? t('dash.incoming') : t('dash.trips'))}</a>
      ${hostingEnabled ? `<a href="#/dashboard/trips" class="${tab === 'trips' ? 'is-active' : ''}">${icon('globe')}${esc(t('dash.trips'))}</a>` : ''}
      ${hostingEnabled ? `<a href="#/dashboard/upcoming" class="${tab === 'upcoming' ? 'is-active' : ''}">${icon('calendar')}${esc(t('dash.upcoming'))}</a>` : ''}
      <a href="#/messages">${icon('message')}${esc(t('msg.title'))}</a>
      <a href="#/dashboard/profile" class="${tab === 'profile' ? 'is-active' : ''}">${icon('users')}${esc(t('nav.profile'))}</a>
      <a href="#/dashboard/settings" class="${tab === 'settings' ? 'is-active' : ''}">${icon('lock')}${esc(t('nav.settings'))}</a>
      ${user.role === 'admin' ? `<a href="#/admin">${icon('shield')}${esc(t('nav.admin'))}</a>` : ''}
    </nav>

    <div>
      <header class="dash-head">
        <img class="avatar avatar--lg" src="${avatarSrc}" alt="" />
        <div class="dash-head__main">
          <h1 class="dash-head__name">${esc(user.name)}</h1>
          <div class="dash-head__meta">${user.username ? '@' + esc(user.username) + ' · ' : ''}${esc(user.email)}</div>
          <div class="chips" style="margin-top:8px">
            ${hostingEnabled ? `<span class="badge badge--accepted">${icon('users')}${esc(t('profile.hosting'))}</span>` : `<span class="badge">${icon('users')}${esc(t('dash.notListed'))}</span>`}
            ${user.emailVerified ? `<span class="badge badge--verified">${icon('shield')}${esc(t('host.verified'))}</span>` : ''}
            ${user.role === 'admin' ? `<span class="badge badge--women">${icon('shield')}${esc(t('nav.admin'))}</span>` : ''}
          </div>
        </div>
        <div class="dash-head__actions">
          <a class="btn btn--outline btn--sm" href="#/dashboard/settings">${icon('lock')}${esc(t('nav.settings'))}</a>
        </div>
      </header>

      ${!hostingEnabled && store.isRemote() ? `
        <div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px;border-color:var(--blue-100);background:var(--blue-050)">
          ${icon('users')}
          <div style="flex:1;min-width:200px">
            <strong>${esc(t('dash.notListed'))}</strong>
            <div class="tiny muted">${esc(t('dash.notListedHint'))}</div>
          </div>
          <a class="btn btn--primary btn--sm" href="#/dashboard/profile">${esc(t('profile.hosting'))}</a>
        </div>` : ''}

      ${!user.emailVerified && store.isRemote() && store.mailConfigured() ? `
        <div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px;border-color:#F5DFB0;background:#FFF9EC">
          ${icon('lock')}
          <div style="flex:1;min-width:200px">
            <strong style="color:#7A5200">${esc(t('auth.notVerified'))}</strong>
            <div class="tiny" style="color:#7A5200">${esc(user.email)}</div>
          </div>
          <button class="btn btn--outline btn--sm" data-action="resend-verification">${esc(t('auth.resend'))}</button>
        </div>` : ''}

      ${tab === 'profile' ? profileTab : tab === 'settings' ? settingsTab : `
        <div class="dash-stats">
          <div class="stat-card"><span class="stat-card__num">${list.length}</span><span class="stat-card__label">${esc(hostingEnabled && !showTrips ? t('dash.incoming') : t('dash.trips'))}</span></div>
          <div class="stat-card"><span class="stat-card__num">${pending}</span><span class="stat-card__label">${esc(t('dash.pending'))}</span></div>
          <div class="stat-card"><span class="stat-card__num">${accepted}</span><span class="stat-card__label">${esc(t('dash.accepted'))}</span></div>
        </div>
        <div class="stack" style="gap:14px">
          ${list.length ? list.map(requestRow).join('') : empty(t('dash.empty'), t('search.noneHint'), 'calendar')}
        </div>`}
    </div>
  </div>`;
}

/* --------------------------------------------------------------- messages */

export function messagesView(threadId) {
  const user = store.currentUser();
  if (!user) return authView('login');
  const threads = store.threadsFor(user);
  const active = threads.find((x) => x.id === threadId) || threads[0] || null;
  const msgs = active ? store.messagesFor(active.id) : [];
  const other = (th) => {
    const iAmHost = th.hostId === user.id || (user.hostId && th.hostId === user.hostId);
    return iAmHost
      ? th.guestName || '—'
      : th.hostName || (hostById(th.hostId) || {}).name || '—';
  };

  return `
  <div class="container">
    <div class="row row--between" style="margin-top:32px">
      <h1 style="font-size:1.7rem">${esc(t('msg.title'))}</h1>
    </div>
    <div class="msg-layout">
      <div class="thread-list">
        ${threads.length ? threads.map((th) => `
          <a class="thread-item ${active && active.id === th.id ? 'is-active' : ''}" href="#/messages/${th.id}">
            <img class="avatar" src="${avatar(other(th), th.id)}" alt="" />
            <div style="min-width:0">
              <div class="thread-item__name">${esc(other(th))}</div>
              <div class="thread-item__preview">${esc((store.messagesFor(th.id).slice(-1)[0] || {}).text || '')}</div>
            </div>
          </a>`).join('') : `<p class="small muted" style="padding:20px">${esc(t('msg.empty'))}</p>`}
      </div>
      <div class="thread-pane">
        ${active ? `
          <div class="thread-pane__head">
            <img class="avatar" src="${avatar(other(active), active.id)}" alt="" />
            <strong>${esc(other(active))}</strong>
            <span class="spacer"></span>
            <a class="btn btn--outline btn--sm" href="#/host/${active.hostId}">${esc(t('nav.profile'))}</a>
          </div>
          <div class="thread-pane__body" id="thread-body">
            ${msgs.map((m) => `
              <div class="bubble ${m.senderId === user.id ? 'bubble--me' : ''}">
                ${esc(m.text)}
                <span class="bubble__time">${new Date(m.at).toLocaleString(getLang(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>`).join('') || `<p class="small muted">${esc(t('msg.empty'))}</p>`}
          </div>
          <form class="thread-pane__form" id="msg-form" data-thread="${active.id}">
            <input class="input" name="text" placeholder="${esc(t('msg.placeholder'))}" autocomplete="off" required />
            <button class="btn btn--primary" type="submit">${esc(t('msg.send'))}</button>
          </form>
        ` : `<div class="empty" style="margin:20px">${icon('message')}<h4>${esc(t('msg.empty'))}</h4><p>${esc(t('msg.pick'))}</p></div>`}
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ admin */

export function adminView(tab = 'reports') {
  const user = store.currentUser();
  if (!user || user.role !== 'admin') return authView('login');
  const s = store.get();
  const openReports = s.reports.filter((r) => r.status === 'open');
  const pendingVerif = s.verifications.filter((v) => v.status === 'pending');

  const reportRow = (r) => `
    <tr>
      <td><strong>${esc(r.targetName)}</strong><div class="tiny muted">${esc(r.targetType)} · ${esc(r.targetId)}</div></td>
      <td>${esc(r.reason)}</td>
      <td class="small muted" style="max-width:320px">${esc(r.detail)}</td>
      <td><span class="badge badge--${r.status === 'open' ? 'pending' : 'accepted'}">${esc(r.status)}</span></td>
      <td>
        <div class="row" style="gap:6px">
          <button class="btn btn--green btn--sm" data-action="resolve-report" data-id="${r.id}">${esc(t('admin.approve'))}</button>
          <button class="btn btn--danger btn--sm" data-action="ban-user" data-id="${r.targetId}">${esc(t('admin.ban'))}</button>
        </div>
      </td>
    </tr>`;

  const verifRow = (v) => `
    <tr>
      <td><strong>${esc(v.name)}</strong><div class="tiny muted">${esc(v.city)}</div></td>
      <td class="small muted">${esc(new Date(v.submittedAt).toLocaleDateString(getLang()))}</td>
      <td><span class="badge badge--${v.status === 'pending' ? 'pending' : v.status === 'approved' ? 'accepted' : 'declined'}">${esc(v.status)}</span></td>
      <td>
        <div class="row" style="gap:6px">
          <button class="btn btn--green btn--sm" data-action="verify-approve" data-id="${v.id}">${esc(t('admin.approve'))}</button>
          <button class="btn btn--outline btn--sm" data-action="verify-reject" data-id="${v.id}">${esc(t('admin.reject'))}</button>
        </div>
      </td>
    </tr>`;

  return `
  <div class="container section--tight">
    <div class="row row--between" style="margin-bottom:18px;flex-wrap:wrap;gap:12px">
      <h1 style="font-size:1.7rem">${esc(t('admin.title'))}</h1>
      <span class="badge badge--women">${icon('shield')}${esc(t('common.demo'))}</span>
    </div>

    <div class="grid grid--4" style="margin-bottom:26px">
      <div class="stat-card"><span class="stat-card__num">${openReports.length}</span><span class="stat-card__label">${esc(t('admin.reports'))}</span></div>
      <div class="stat-card"><span class="stat-card__num">${pendingVerif.length}</span><span class="stat-card__label">${esc(t('admin.verifications'))}</span></div>
      <div class="stat-card"><span class="stat-card__num">${s.users.length}</span><span class="stat-card__label">${esc(t('admin.users'))}</span></div>
      <div class="stat-card"><span class="stat-card__num">${allHosts().length}</span><span class="stat-card__label">${esc(t('nav.explore'))}</span></div>
    </div>

    <div class="tabs">
      <a class="tab ${tab === 'reports' ? 'is-active' : ''}" href="#/admin">${esc(t('admin.reports'))}<span class="tab__count">${openReports.length}</span></a>
      <a class="tab ${tab === 'verifications' ? 'is-active' : ''}" href="#/admin/verifications">${esc(t('admin.verifications'))}<span class="tab__count">${pendingVerif.length}</span></a>
      <a class="tab ${tab === 'members' ? 'is-active' : ''}" href="#/admin/members">${esc(t('admin.users'))}<span class="tab__count">${s.users.length}</span></a>
    </div>

    ${tab === 'reports' ? `
      <div class="table-wrap"><div class="table-scroll"><table class="admin-table">
        <thead><tr><th>${esc(t('admin.users'))}</th><th>${esc(t('admin.reports'))}</th><th>${esc(t('host.about'))}</th><th>${esc(t('dash.pending'))}</th><th></th></tr></thead>
        <tbody>${openReports.length ? openReports.map(reportRow).join('') : `<tr><td colspan="5" class="muted">${esc(t('admin.empty'))}</td></tr>`}</tbody>
      </table></div></div>`
    : tab === 'verifications' ? `
      <div class="table-wrap"><div class="table-scroll"><table class="admin-table">
        <thead><tr><th>${esc(t('auth.name'))}</th><th>${esc(t('host.member'))}</th><th>${esc(t('dash.pending'))}</th><th></th></tr></thead>
        <tbody>${pendingVerif.length ? pendingVerif.map(verifRow).join('') : `<tr><td colspan="4" class="muted">${esc(t('admin.empty'))}</td></tr>`}</tbody>
      </table></div></div>`
    : `
      <div class="table-wrap"><div class="table-scroll"><table class="admin-table">
        <thead><tr><th>${esc(t('auth.name'))}</th><th>${esc(t('auth.email'))}</th><th>${esc(t('auth.city'))}</th><th>${esc(t('dash.verified'))}</th></tr></thead>
        <tbody>${s.users.map((u) => `
          <tr>
            <td class="row" style="gap:10px"><img class="avatar avatar--sm" src="${avatar(u.name, u.id)}" alt="" /><strong>${esc(u.name)}</strong></td>
            <td class="small muted">${esc(u.email)}</td>
            <td class="small muted">${esc(u.city)}</td>
            <td>${u.verified ? `<span class="badge badge--verified">${icon('shield')}${esc(t('host.verified'))}</span>` : `<span class="badge">—</span>`}</td>
          </tr>`).join('')}
        </tbody>
      </table></div></div>`}
  </div>`;
}

/* ---------------------------------------------------------------- form c */

export function formCView() {
  const state = store.formCState();
  const steps = [1, 2, 3, 4, 5];
  const done = steps.filter((n) => state[`step${n}`]).length;
  const pct = Math.round((done / steps.length) * 100);

  return `
  <div class="page-head"><div class="container">
    <span class="eyebrow">${icon('shield')}India · foreign guests</span>
    <h1 style="margin-top:12px">${esc(t('formc.title'))}</h1>
    <p class="lede" style="max-width:70ch">${esc(t('formc.sub'))}</p>
  </div></div>

  <div class="container" style="padding-block:32px 72px">
    <div class="formc-layout">
      <div>
        <div class="card" style="margin-bottom:18px">
          <div class="row row--between" style="margin-bottom:10px">
            <strong>${esc(t('formc.progress', { n: pct }))}</strong>
            <span class="small muted">${done}/${steps.length}</span>
          </div>
          <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
          <div class="row row--wrap" style="gap:8px;margin-top:16px">
            <button class="btn btn--outline btn--sm" data-action="print">${icon('eye')}${esc(t('formc.print'))}</button>
            <button class="btn btn--ghost btn--sm" data-action="reset-formc">${esc(t('formc.reset'))}</button>
          </div>
        </div>

        <div class="checklist">
          ${steps.map((n) => `
            <label class="check-item ${state[`step${n}`] ? 'is-done' : ''}">
              <input class="check-toggle" type="checkbox" data-formc="step${n}" ${state[`step${n}`] ? 'checked' : ''} />
              <span class="step-num">${state[`step${n}`] ? '✓' : n}</span>
              <span class="check-item__body">
                <h4>${esc(t(`formc.step${n}t`))}</h4>
                <p>${esc(t(`formc.step${n}d`))}</p>
              </span>
            </label>`).join('')}
        </div>
      </div>

      <aside class="stack" style="gap:16px">
        <div class="card">
          <h4 style="display:flex;align-items:center;gap:9px;margin-bottom:8px">${icon('calendar')}${esc(t('formc.deadline'))}</h4>
          <p class="small">${esc(t('formc.who'))}</p>
        </div>
        <div class="card">
          <h4 style="display:flex;align-items:center;gap:9px;margin-bottom:8px">${icon('lock')}${esc(t('formc.keep'))}</h4>
          <ul class="stack" style="gap:8px">
            ${['Passport number and nationality', 'Visa type, number and expiry', 'Arrival and departure dates', 'Your full address and phone']
              .map((x) => `<li class="row small" style="gap:9px;align-items:flex-start">${icon('check')}<span>${esc(x)}</span></li>`).join('')}
          </ul>
        </div>
        <div class="card" style="border-color:#F5DFB0;background:#FFF9EC">
          <p class="small" style="color:#7A5200;margin:0">${esc(t('formc.note'))}</p>
        </div>
        <a class="btn btn--ink btn--block" href="https://indianfrro.gov.in/eservices/home.jsp" target="_blank" rel="noopener noreferrer">
          ${esc(t('formc.portal'))}${icon('arrow')}
        </a>
      </aside>
    </div>
  </div>`;
}

/* --------------------------------------------------------------- not found */

export function notFoundView() {
  return `
  <div class="container section" style="text-align:center">
    <h1>404</h1>
    <p class="lede" style="margin:12px 0 24px">${esc(t('search.none'))}</p>
    <a class="btn btn--primary" href="#/">${esc(t('nav.home'))}</a>
  </div>`;
}

/* ----------------------------------------------------------------- modal */

export function requestModal(hostId) {
  const host = hostById(hostId);
  if (!host) return '';
  const city = cityBySlug(host.citySlug);
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const plus = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  return `
  <div class="modal-backdrop" data-action="close-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="req-title" onclick="event.stopPropagation()">
      <div class="row row--between">
        <h3 id="req-title">${esc(t('req.title', { name: host.name }))}</h3>
        <button class="icon-btn" data-action="close-modal" aria-label="${esc(t('common.close'))}">${icon('x')}</button>
      </div>
      <div class="row" style="gap:12px;padding:12px;background:var(--surface-2);border-radius:var(--radius-sm)">
        <img class="avatar" src="${avatar(host.name, host.id)}" alt="" />
        <div><strong class="small">${esc(host.name)}</strong><div class="tiny muted">${esc(city ? `${city.name}, ${city.country}` : '')}</div></div>
      </div>
      <form id="request-form" data-host="${host.id}" class="stack" style="gap:14px">
        <div class="grid grid--2" style="gap:12px">
          <div class="field"><label for="r-from">${esc(t('search.when'))}</label>
            <input class="input" id="r-from" name="from" type="date" value="${plus(14)}" required /></div>
          <div class="field"><label for="r-to">${esc(t('search.when'))} →</label>
            <input class="input" id="r-to" name="to" type="date" value="${plus(17)}" required /></div>
        </div>
        <div class="field"><label for="r-guests">${esc(t('req.guests'))}</label>
          <select class="select" id="r-guests" name="guests">
            ${Array.from({ length: host.maxGuests }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="r-msg">${esc(t('req.message'))}</label>
          <textarea class="textarea" id="r-msg" name="message" required
            placeholder="${esc(t('req.placeholder', { name: host.name.split(' ')[0], city: city ? city.name : '' }))}"></textarea>
        </div>
        <div class="row" style="gap:8px;justify-content:flex-end">
          <button type="button" class="btn btn--ghost" data-action="close-modal">${esc(t('req.cancel'))}</button>
          <button type="submit" class="btn btn--primary">${icon('check')}${esc(t('req.send'))}</button>
        </div>
      </form>
    </div>
  </div>`;
}

export function reportModal(hostId, hostName) {
  return `
  <div class="modal-backdrop" data-action="close-modal">
    <div class="modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="row row--between">
        <h3>${esc(t('admin.reports'))}</h3>
        <button class="icon-btn" data-action="close-modal" aria-label="${esc(t('common.close'))}">${icon('x')}</button>
      </div>
      <p class="small muted">${esc(hostName)}</p>
      <form id="report-form" data-id="${hostId}" data-name="${esc(hostName)}" class="stack" style="gap:14px">
        <div class="field"><label for="rp-reason">${esc(t('admin.reports'))}</label>
          <select class="select" id="rp-reason" name="reason">
            <option value="Asked for money">Asked for money</option>
            <option value="Harassment in messages">Harassment in messages</option>
            <option value="Photos not of the host">Photos not of the host</option>
            <option value="Unsafe or unclean space">Unsafe or unclean space</option>
          </select>
        </div>
        <div class="field"><label for="rp-detail">${esc(t('req.message'))}</label>
          <textarea class="textarea" id="rp-detail" name="detail" required></textarea>
        </div>
        <div class="row" style="gap:8px;justify-content:flex-end">
          <button type="button" class="btn btn--ghost" data-action="close-modal">${esc(t('common.cancel'))}</button>
          <button type="submit" class="btn btn--danger">${icon('flag')}${esc(t('admin.reports'))}</button>
        </div>
      </form>
    </div>
  </div>`;
}
