import { fetchJSON, qs } from '../core/utilities.js';

const FALLBACK = [
  { client: 'Mo2bet', title: 'A national launch built on creator trust', image: 'assets/images/case-studies/mo2bet-launch.png' },
  { client: 'Sokojet', title: 'Turning a marketplace into a movement', image: 'assets/images/case-studies/sokojet-campaign.jpg' },
  { client: 'Tecno Kenya', title: 'On-ground activation, 12 cities', image: 'assets/images/case-studies/tecno-activation.jpg' },
  { client: 'Luminara Real Estate', title: 'A brand film that sold out a launch', image: 'assets/images/case-studies/luminara-brand-film.jpg' },
];

export async function initPortfolioSection() {
  const grid = qs('[data-campaigns-grid]');
  if (!grid) return;

  let campaigns = await fetchJSON('data/portfolio.json');
  if (!campaigns.length) campaigns = FALLBACK;

  grid.innerHTML = campaigns
    .map(
      (c) => `
    <a href="work.html" class="card--case reveal" data-image-reveal>
      <img src="${c.image}" alt="${c.title}" loading="lazy">
      <div class="card__overlay">
        <div class="mono-label">${c.client}</div>
        <h3>${c.title}</h3>
      </div>
    </a>`
    )
    .join('');
}
