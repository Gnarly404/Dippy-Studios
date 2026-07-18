import { fetchJSON, qs } from '../core/utilities.js';
import { getDb, collection, getDocs, isFirebaseConfigured } from '../core/firebaseClient.js';
import { BRANDS_COLLECTION } from '../core/config.js';

const FALLBACK = [
  { id: 'mixgo', name: 'Mixgo', color: '#1E6FEB', file: 'mixgo.svg' },
  { id: 'mavo-bigwaservices', name: 'Mavo Bigwaservices', color: '#0F8A5F', file: 'mavo-bigwaservices.svg' },
  { id: 'kessgame', name: 'Kessgame', color: '#7B2FF7', file: 'kessgame.svg' },
  { id: 'mo2bet', name: 'Mo2bet', color: '#E11D2E', file: 'mo2bet.svg' },
  { id: 'sokojet', name: 'Sokojet', color: '#FF7A00', file: 'sokojet.svg' },
  { id: 'gosupa', name: 'Gosupa', color: '#12B76A', file: 'gosupa.svg' },
  { id: 'luminara', name: 'Luminara Real Estate', color: '#B08D3F', file: 'luminara-real-estate.svg' },
  { id: 'collmarks', name: 'Collmarks Computers', color: '#1B3A66', file: 'collmarks.svg' },
  { id: 'helabet', name: 'Helabet', color: '#0B2F6B', file: 'helabet.svg' },
  { id: 'tecno', name: 'Tecno Kenya', color: '#D2001F', file: 'tecno.svg' },
  { id: 'buysimu', name: 'Buysimu', color: '#9333EA', file: 'buysimu.svg' },
  { id: 'mbogibet', name: 'Mbogibet', color: '#166534', file: 'mbogibet.svg' },
  { id: 'academiasupport', name: 'Academiasupportke', color: '#0E7490', file: 'academiasupport.svg' },
];

async function fetchFromFirestore() {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(collection(getDb(), BRANDS_COLLECTION));
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.error('Could not load brands from Firestore:', err);
    return [];
  }
}

function logoSrc(b) {
  // Firestore-added brands store a full image (path or base64) in `logo`;
  // the original static entries reference a local file by name instead.
  return b.logo || `assets/images/brands/${b.file}`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export async function initBrandsSection() {
  const wall = qs('[data-logo-wall]');
  if (!wall) return;

  const [jsonBrands, firestoreBrands] = await Promise.all([
    fetchJSON('data/brands.json'),
    fetchFromFirestore(),
  ]);

  const firestoreNames = new Set(firestoreBrands.map((b) => b.name));
  const dedupedJson = (jsonBrands || []).filter((b) => !firestoreNames.has(b.name));

  let brands = [...dedupedJson, ...firestoreBrands];
  if (!brands.length) brands = FALLBACK;

  wall.innerHTML = brands
    .map(
      (b) => `
    <div class="logo-wall__item" style="--brand-color:${escapeHtml(b.color || '#999')}" title="${escapeHtml(b.name)}">
      <img src="${escapeHtml(logoSrc(b))}" alt="${escapeHtml(b.name)} logo" loading="lazy" width="160" height="90">
    </div>`
    )
    .join('');
}
