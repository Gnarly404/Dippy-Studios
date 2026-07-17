import { fetchJSON, qs } from '../core/utilities.js';

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

export async function initBrandsSection() {
  const wall = qs('[data-logo-wall]');
  if (!wall) return;

  let brands = await fetchJSON('data/brands.json');
  if (!brands.length) brands = FALLBACK;

  wall.innerHTML = brands
    .map(
      (b) => `
    <div class="logo-wall__item" style="--brand-color:${b.color}" title="${b.name}">
      <img src="assets/images/brands/${b.file}" alt="${b.name} logo" loading="lazy" width="160" height="90">
    </div>`
    )
    .join('');
}
