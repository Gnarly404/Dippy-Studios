import { fetchJSON, qs } from '../core/utilities.js';
import {
  getDb,
  collection,
  getDocs,
  query,
  where,
  isFirebaseConfigured,
} from '../core/firebaseClient.js';
import { CREATORS_COLLECTION } from '../core/config.js';
import { socialLinkFor, PLATFORM_LABEL } from '../core/socialLinks.js';

const FALLBACK = [
  { name: 'Amara Otieno', niche: 'Lifestyle', followers: '212K', photo: 'assets/images/creators/amara-otieno.svg' },
  { name: 'Brian Mwangi', niche: 'Comedy', followers: '480K', photo: 'assets/images/creators/brian-mwangi.svg' },
  { name: 'Faith Chebet', niche: 'Beauty', followers: '165K', photo: 'assets/images/creators/faith-chebet.svg' },
  { name: 'Kevo Juma', niche: 'Tech', followers: '98K', photo: 'assets/images/creators/kevo-juma.svg' },
];

async function fetchApprovedFromFirestore() {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(getDb(), CREATORS_COLLECTION), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const c = d.data();
      return {
        name: c.name,
        niche: c.niche,
        followers: c.followers,
        photo: c.photo, // base64 data URL saved at application time
        bio: c.bio || '',
        socials: c.socials || {},
      };
    });
  } catch (err) {
    console.error('Could not load approved creators from Firestore:', err);
    return [];
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

// ---------------------------------------------------------------------------
// Detail modal: one instance, injected once, reused for whichever creator
// card was clicked. Keeps the actual creator data in memory (not baked
// into HTML attributes) and looks it up by index on click.
// ---------------------------------------------------------------------------
let modalEl = null;
let lastFocused = null;

function ensureModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.className = 'creator-modal';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.innerHTML = `
    <div class="creator-modal__backdrop" data-creator-modal-close></div>
    <div class="creator-modal__panel">
      <button type="button" class="creator-modal__close" data-creator-modal-close aria-label="Close">&times;</button>
      <img class="creator-modal__photo" data-modal-photo alt="">
      <h3 data-modal-name></h3>
      <div class="mono-label" data-modal-meta></div>
      <p class="creator-modal__bio" data-modal-bio></p>
      <div class="creator-modal__socials" data-modal-socials></div>
    </div>
  `;
  document.body.appendChild(modalEl);

  modalEl.querySelectorAll('[data-creator-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
  });

  return modalEl;
}

function openModal(creator) {
  const modal = ensureModal();
  lastFocused = document.activeElement;

  modal.querySelector('[data-modal-photo]').src = creator.photo || '';
  modal.querySelector('[data-modal-photo]').alt = creator.name || '';
  modal.querySelector('[data-modal-name]').textContent = creator.name || '';
  modal.querySelector('[data-modal-meta]').textContent =
    [creator.niche, creator.followers ? `${creator.followers} followers` : null].filter(Boolean).join(' · ');

  const bioEl = modal.querySelector('[data-modal-bio]');
  bioEl.textContent = creator.bio || '';
  bioEl.hidden = !creator.bio;

  const socialsEl = modal.querySelector('[data-modal-socials]');
  const links = Object.entries(creator.socials || {})
    .map(([platform, raw]) => {
      const href = socialLinkFor(platform, raw);
      return href ? { platform, href } : null;
    })
    .filter(Boolean);

  socialsEl.innerHTML = links.length
    ? links
        .map(
          ({ platform, href }) =>
            `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(PLATFORM_LABEL[platform] || platform)}</a>`
        )
        .join('')
    : '';

  modal.classList.add('is-open');
  document.body.classList.add('modal-open');
  modal.querySelector('.creator-modal__close').focus();
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  (lastFocused || document.body).focus();
}

export async function initCreatorsSection() {
  const grid = qs('[data-creators-grid]');
  if (!grid) return;

  const [jsonCreators, firestoreCreators] = await Promise.all([
    fetchJSON('data/creators.json'),
    fetchApprovedFromFirestore(),
  ]);

  // Firestore is the source of truth once a creator has been imported/approved
  // there, so drop any static JSON entry with a matching name to avoid
  // showing the same creator twice.
  const firestoreNames = new Set(firestoreCreators.map((c) => c.name));
  const dedupedJson = (jsonCreators || []).filter((c) => !firestoreNames.has(c.name));

  let creators = [...dedupedJson, ...firestoreCreators];
  if (!creators.length) creators = FALLBACK;

  grid.innerHTML = creators
    .map(
      (c, i) => `
    <article class="card card--creator reveal" data-creator-index="${i}" tabindex="0" role="button" aria-label="View ${escapeHtml(c.name)}'s profile">
      <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" loading="lazy">
      <div class="card__overlay">
        <strong>${escapeHtml(c.name)}</strong>
        <div class="mono-label">${escapeHtml(c.niche)} · ${escapeHtml(c.followers)}</div>
      </div>
    </article>`
    )
    .join('');

  grid.querySelectorAll('[data-creator-index]').forEach((card) => {
    const open = () => openModal(creators[Number(card.dataset.creatorIndex)]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}
