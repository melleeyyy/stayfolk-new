/**
 * StayFolk — i18n core.
 * English is the source of truth and the fallback for every other locale.
 * UI strings are translated; user-generated content (bios, reviews) stays in
 * the language its author wrote it in — same as any real marketplace.
 */

export const LANGS = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', dir: 'ltr' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'de', label: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'pt', label: 'Portuguese', native: 'Português', dir: 'ltr' },
  { code: 'ru', label: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'ko', label: 'Korean', native: '한국어', dir: 'ltr' },
  { code: 'ja', label: 'Japanese', native: '日本語', dir: 'ltr' },
];

const en = {
  'brand.tagline': 'Hospitality exchange',

  'nav.home': 'Home',
  'nav.explore': 'Explore hosts',
  'nav.cities': 'Cities',
  'nav.how': 'How it works',
  'nav.safety': 'Safety',
  'nav.dashboard': 'Host dashboard',
  'nav.messages': 'Messages',
  'nav.admin': 'Moderation',
  'nav.login': 'Log in',
  'nav.signup': 'Join free',
  'nav.logout': 'Log out',
  'nav.profile': 'My profile',
  'nav.settings': 'Settings',
  'set.prefs': 'Preferences',
  'set.account': 'Account',
  'nav.home': 'Home',
  'nav.menu': 'Menu',
  'nav.language': 'Language',
  'nav.theme': 'Toggle theme',

  'hero.eyebrow': 'Free stays · 40+ cities',
  'hero.title': 'Travel like a |local|. Host like a |friend|.',
  'hero.sub': 'StayFolk is a free hospitality exchange. Sleep on a real couch, share meals and stories with verified hosts — and open your own door when you travel the other way.',
  'hero.city': 'Where to?',
  'hero.cityPlaceholder': 'City or country',
  'hero.when': 'When',
  'hero.guests': 'Guests',
  'hero.search': 'Find a host',
  'hero.note': 'No booking fees. No payment for the stay. Just people.',

  'stats.hosts': 'Verified hosts',
  'stats.cities': 'Cities',
  'stats.countries': 'Countries',
  'stats.stays': 'Stays arranged',

  'how.title': 'How StayFolk works',
  'how.sub': 'Four steps, zero money. Hosts offer a couch or a spare room; guests bring curiosity and good manners.',
  'how.s1t': 'Build a real profile',
  'how.s1d': 'Add photos, languages and a few honest lines about yourself. Verified members get far more replies.',
  'how.s2t': 'Send a personal request',
  'how.s2d': 'Pick your dates, say why you are travelling and what you would like to do together. No copy-paste messages.',
  'how.s3t': 'Chat, then confirm',
  'how.s3d': 'Your host accepts or declines within a few days. Once accepted, messaging opens and you agree the details.',
  'how.s4t': 'Stay, then review',
  'how.s4d': 'After the stay both sides write an honest review. Reviews cannot be edited or deleted.',

  'featured.title': 'Hosts opening their doors',
  'featured.sub': 'Real profiles from the community, reviewed by our team.',
  'featured.all': 'Browse all hosts',

  'homecities.title': 'Where people are hosting',
  'homecities.sub': 'Pick a city and see who is free this month.',

  'trust.title': 'Trust is the product',
  'trust.sub': 'Every host is reviewed by a human before going live, and every member can report a profile in one tap.',
  'trust.1t': 'ID verified',
  'trust.1d': 'Government ID checked through a KYC partner. We store the pass or fail, never the document.',
  'trust.2t': 'Community references',
  'trust.2d': 'People who actually know you vouch for you. References cannot be bought or faked.',
  'trust.3t': 'Reviews that stay',
  'trust.3d': 'Public, permanent and two-sided. Hosts and guests are held to the same standard.',

  'cta.title': 'Open your door. See the world.',
  'cta.sub': 'Hosting is not a side hustle here — it is the whole point. Share a room, learn a city, make a friend.',
  'cta.host': 'Become a host',
  'cta.guest': 'Find a stay',

  'search.title': 'Find a host',
  'search.where': 'Where',
  'search.when': 'Check-in',
  'search.guests': 'Guests',
  'search.filters': 'Filters',
  'search.language': 'Spoken language',
  'search.anyLanguage': 'Any language',
  'search.verified': 'Verified hosts only',
  'search.women': 'Women-only hosting',
  'search.sort': 'Sort by',
  'search.sortRating': 'Top rated',
  'search.sortNew': 'Newest members',
  'search.sortResponse': 'Fastest response',
  'search.results': '{n} hosts available',
  'search.none': 'No hosts match those filters',
  'search.noneHint': 'Try a nearby city, clear a filter, or write to a host who is away — many reply anyway.',
  'search.clear': 'Clear filters',
  'search.all': 'All cities',

  'host.about': 'About',
  'host.speaks': 'Speaks',
  'host.response': 'Response rate',
  'host.member': 'Member since',
  'host.references': 'References',
  'host.reviews': 'Reviews',
  'host.request': 'Request a stay',
  'host.verified': 'ID verified',
  'host.unverified': 'Not verified yet',
  'host.women': 'Women only',
  'host.guests': 'Up to {n} guests',
  'host.room': 'Space',
  'host.rules': 'House rules',
  'host.availability': 'Availability',
  'host.similar': 'Other hosts nearby',
  'host.share': 'Share profile',

  'req.title': 'Request a stay with {name}',
  'req.guests': 'Guests',
  'req.message': 'Your message',
  'req.placeholder': 'Hi {name}! I am travelling to {city} because... I would love to...',
  'req.send': 'Send request',
  'req.cancel': 'Cancel',
  'req.login': 'Log in to send a request',
  'req.sent': 'Request sent to {name}',

  'auth.username': 'Username',
  'auth.usernameHint': '3–20 characters: lowercase letters, numbers and underscore.',
  'auth.passwordHint': 'At least 8 characters.',
  'auth.photoOptional': 'Profile photo (optional)',
  'auth.forgot': 'Forgot your password?',
  'auth.verifyTitle': 'Check your email',
  'auth.verifyOk': 'Your email is verified — welcome aboard.',
  'auth.verifyFail': 'We could not verify that link.',
  'auth.verifyChecking': 'Verifying your link…',
  'auth.verifySent': 'Verification link sent',
  'auth.resend': 'Resend link',
  'auth.notVerified': 'Your email is not verified yet',
  'auth.changePassword': 'Change password',
  'auth.currentPassword': 'Current password',
  'auth.newPassword': 'New password',
  'auth.passwordChanged': 'Password changed',
  'auth.resetTitle': 'Choose a new password',
  'auth.resetSent': 'If that account exists, a reset link is on its way.',

  'mail.test': 'Send test email',
  'mail.testOk': 'Test email sent — check your inbox and spam',

  'auth.loginTitle': 'Welcome back',
  'auth.loginSub': 'Log in to manage requests and messages.',
  'auth.signupTitle': 'Join StayFolk',
  'auth.signupSub': 'Free forever. No card, no booking fee.',
  'auth.name': 'Full name',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.city': 'Home city',
  'auth.login': 'Log in',
  'auth.signup': 'Create account',
  'auth.toSignup': 'New here? Create an account',
  'auth.toLogin': 'Already a member? Log in',
  'auth.demo': 'Demo accounts',
  'auth.invalid': 'Email or password is incorrect',
  'auth.welcome': 'Welcome, {name}',

  'dash.title': 'Host dashboard',
  'dash.trips': 'My trips',
  'dash.photos': 'Photos',
  'dash.hosting': 'Hosting',
  'dash.security': 'Security',
  'dash.notListed': 'You are not listed in Explore yet',
  'dash.notListedHint': 'Turn on hosting below and people searching your city will find you.',
  'dash.incoming': 'Incoming requests',
  'dash.upcoming': 'Upcoming stays',
  'dash.profile': 'My hosting profile',
  'dash.accept': 'Accept',
  'dash.decline': 'Decline',
  'dash.pending': 'Pending',
  'dash.accepted': 'Accepted',
  'dash.declined': 'Declined',
  'dash.empty': 'No requests yet',
  'dash.verify': 'Verify my ID',
  'dash.verified': 'Your ID is verified',

  'msg.title': 'Messages',
  'msg.empty': 'No conversations yet',
  'msg.placeholder': 'Write a message...',
  'msg.send': 'Send',
  'msg.pick': 'Select a conversation',

  'admin.title': 'Moderation console',
  'admin.reports': 'Reports',
  'admin.verifications': 'ID verification queue',
  'admin.users': 'Members',
  'admin.approve': 'Approve',
  'admin.reject': 'Reject',
  'admin.ban': 'Ban member',
  'admin.empty': 'Nothing in the queue',
  'admin.overview': 'Overview',

  'safety.title': 'Safety centre',
  'safety.sub': 'Hospitality exchange runs on trust. Read this before your first stay — it takes four minutes and prevents most problems.',
  'safety.emergency': 'Emergency',
  'safety.emergencyText': 'In an emergency, contact local emergency services first, then report the profile on StayFolk.',

  'cities.title': 'Cities',
  'cities.sub': 'Hosts are active in these cities right now.',
  'cities.hosts': '{n} hosts',

  'footer.about': 'StayFolk is a hospitality exchange — not a booking site. Stays are free and always will be.',
  'footer.explore': 'Explore',
  'footer.support': 'Support',
  'footer.legal': 'Legal',
  'footer.terms': 'Terms of service',
  'footer.privacy': 'Privacy policy',
  'footer.contact': 'Contact',
  'footer.made': 'Built as a product demo.',
  'footer.rights': '© 2026 StayFolk. All rights reserved.',

  'nav.formc': 'Form C checklist',
  'profile.hosting': 'I can host guests',
  'profile.saved': 'Profile saved',
  'pwa.install': 'Install app',
  'pwa.installed': 'App installed',

  'upload.photo': 'Profile photo',
  'upload.cover': 'Cover photo',
  'upload.change': 'Change',
  'upload.remove': 'Remove',
  'upload.hint': 'JPG or PNG up to 8 MB. Downscaled and stored in this browser only.',

  'formc.title': 'Form C & FRRO checklist',
  'formc.sub': 'If you host a foreign national in India you must report their arrival. This is the whole process, in order — tick each step as you go.',
  'formc.note': 'Rules differ by state and change over time. Confirm with your local FRO before your first international guest. This is guidance, not legal advice.',
  'formc.progress': '{n}% complete',
  'formc.print': 'Print checklist',
  'formc.portal': 'Open the e-FRRO portal',
  'formc.reset': 'Reset',
  'formc.deadline': 'Within 24 hours',
  'formc.who': 'The host reports the arrival, not the guest. Hotels file Form C; private hosts normally report in person at the FRO or the local police station.',
  'formc.keep': 'Keep these details',
  'formc.step1t': 'Collect passport and visa details before they arrive',
  'formc.step1d': 'Photograph the passport photo page and the visa page. Note the passport number, nationality, visa type and expiry date.',
  'formc.step2t': 'Report the arrival within 24 hours',
  'formc.step2d': 'File Form C at your nearest FRO/FRRO, or report to the local police station if your district has none. Keep the acknowledgement slip.',
  'formc.step3t': 'Keep a guest register',
  'formc.step3d': 'Record name, nationality, passport number, visa number, your address and the exact arrival and departure dates. Inspectors can ask to see it.',
  'formc.step4t': 'Check whether your guest must register separately',
  'formc.step4d': 'Most tourist visas need no extra registration, but student, employment, medical and long-stay visas usually do. The guest registers, not you — remind them on day one.',
  'formc.step5t': 'Close the record when they leave',
  'formc.step5d': 'Note the departure date in your register and, if your FRO asked for it, intimate the departure the same way you reported the arrival.',

  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.demo': 'Demo',
  'common.copy': 'Copy link',
};

import { locales } from './locales.js';
import { extra } from './locales-extra.js';
import { authExtra } from './locales-auth.js';
import { uiExtra } from './locales-ui.js';

const merged = Object.fromEntries(
  Object.entries(locales).map(([code, table]) => [
    code,
    { ...table, ...(extra[code] || {}), ...(authExtra[code] || {}), ...(uiExtra[code] || {}) },
  ])
);

export const DICT = { en, ...merged };

let current = 'en';

export function setLang(code) {
  current = DICT[code] ? code : 'en';
  return current;
}
export function getLang() {
  return current;
}
export function langMeta(code) {
  return LANGS.find((l) => l.code === code) || LANGS[0];
}

/** Translate a key with {placeholder} interpolation. Falls back to English. */
export function t(key, vars) {
  const table = DICT[current] || en;
  let str = table[key];
  if (str === undefined) str = en[key];
  if (str === undefined) return key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (m, k) =>
      Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
    );
  }
  return str;
}

/** Missing-key audit — used by the smoke test, not the UI. */
export function missingKeys() {
  const out = {};
  for (const [code, table] of Object.entries(DICT)) {
    if (code === 'en') continue;
    const miss = Object.keys(en).filter((k) => table[k] === undefined);
    const extra = Object.keys(table).filter((k) => en[k] === undefined);
    if (miss.length || extra.length) out[code] = { miss, extra };
  }
  return out;
}
