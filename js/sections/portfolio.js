import { fetchJSON, qs } from '../core/utilities.js';
import { getDb, collection, getDocs, isFirebaseConfigured } from '../core/firebaseClient.js';
import { CAMPAIGNS_COLLECTION } from '../core/config.js';

const FALLBACK = [
  { client: 'Mo2bet', title: 'A national launch built on creator trust', image: 'assets/images/case-studies/mo2bet-launch.png' },
  { client: 'Sokojet', title: 'Turning a marketplace into a movement', image: 'assets/images/case-studies/sokojet-campaign.jpg' },
  { client: 'Tecno Kenya', title: 'On-ground activation, 12 cities', image: 'assets/images/case-studies/tecno-activation.jpg' },
  { client: 'Luminara Real Estate', title: 'A brand film that sold out a launch', image: 'assets/images/case-studies/luminara-brand-film.jpg' },
];

async function fetchFromFirestore() {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(collection(getDb(), CAMPAIGNS_COLLECTION));
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.error('Could not load campaigns from Firestore:', err);
    return [];
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export async function initPortfolioSection() {
  const grid = qs('[data-campaigns-grid]');
  if (!grid) return;

  const [jsonCampaigns, firestoreCampaigns] = await Promise.all([
    fetchJSON('data/portfolio.json'),
    fetchFromFirestore(),
  ]);

  const firestoreTitles = new Set(firestoreCampaigns.map((c) => c.title));
  const dedupedJson = (jsonCampaigns || []).filter((c) => !firestoreTitles.has(c.title));

  let campaigns = [...dedupedJson, ...firestoreCampaigns];
  if (!campaigns.length) campaigns = FALLBACK;

  grid.innerHTML = campaigns
    .map(
      (c) => `
    <a href="${escapeHtml(c.link || 'work.html')}" class="card--case reveal" data-image-reveal>
      <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.title)}" loading="lazy">
      <div class="card__overlay">
        <div class="mono-label">${escapeHtml(c.client)}</div>
        <h3>${escapeHtml(c.title)}</h3>
      </div>
    </a>`
    )
    .join('');
}
