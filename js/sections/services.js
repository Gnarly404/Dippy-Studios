import { fetchJSON, qs } from '../core/utilities.js';

const FALLBACK = [
  { title: 'Influencer Marketing', body: 'Creator discovery, brand matching, campaign execution and ROI reporting.' },
  { title: 'Creator Management', body: 'Talent representation, contract negotiation and long-term growth strategy.' },
  { title: 'Creative Production', body: 'TV commercials, digital ads, photography, podcasts and motion design.' },
  { title: 'Branding', body: 'Brand identity, logo design, packaging and marketing collateral.' },
  { title: 'Digital Marketing', body: 'Social media management, paid media, SEO, email and web development.' },
  { title: 'Consulting', body: 'Creator economy strategy, employer branding and digital transformation.' },
];

export async function initServicesSection() {
  const grid = qs('[data-services-grid]');
  if (!grid) return;

  let services = await fetchJSON('data/services.json');
  if (!services.length) services = FALLBACK;

  grid.innerHTML = services
    .map(
      (s, i) => `
    <article class="card card--service reveal">
      <div class="card__index">${String(i + 1).padStart(2, '0')}</div>
      <h3 class="card__title">${s.title}</h3>
      <p class="card__body">${s.body}</p>
    </article>`
    )
    .join('');
}
