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

export async function initCreatorsSection() {
  const grid = qs('[data-creators-grid]');
  if (!grid) return;

  const [jsonCreators, firestoreCreators] = await Promise.all([
    fetchJSON('data/creators.json'),
    fetchApprovedFromFirestore(),
  ]);

  let creators = [...(jsonCreators || []), ...firestoreCreators];
  if (!creators.length) creators = FALLBACK;

  grid.innerHTML = creators
    .map(
      (c) => `
    <article class="card card--creator reveal">
      <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" loading="lazy">
      <div class="card__overlay">
        <strong>${escapeHtml(c.name)}</strong>
        <div class="mono-label">${escapeHtml(c.niche)} · ${escapeHtml(c.followers)}</div>
      </div>
    </article>`
    )
    .join('');
}
