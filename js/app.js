import { initLoader } from './core/loader.js';
import { initNavigation } from './core/navigation.js';
import { initSmoothScroll } from './core/smoothScroll.js';
import { initTheme } from './core/theme.js';
import { initCursor } from './core/cursor.js';

import { playIntro } from './gsap/intro.js';
import { initSplitText } from './gsap/textAnimations.js';
import { initReveals } from './gsap/reveal.js';
import { initMagneticButtons } from './gsap/magneticButtons.js';
import { initHeroParallax } from './gsap/hero.js';
import { setupScrollTrigger } from './gsap/scrollTrigger.js';
import { initRibbons } from './gsap/ribbons.js';
import { initParallax } from './gsap/parallax.js';
import { initImageReveals } from './gsap/imageAnimations.js';
import { initPageTransitions } from './gsap/pageTransitions.js';

import { initHeroSection } from './sections/hero.js';
import { initServicesSection } from './sections/services.js';
import { initBrandsSection } from './sections/brands.js';
import { initCreatorsSection } from './sections/creators.js';
import { initTestimonialsSection } from './sections/testimonials.js';
import { initPortfolioSection } from './sections/portfolio.js';
import { initContactSection } from './sections/contact.js';
import { initCreatorApplySection } from './sections/creatorApply.js';
import { initFooterSection } from './sections/footer.js';

async function main() {
  // Structure & content first, so layout is stable before animation binds to it
  initSplitText();
  await Promise.all([
    initServicesSection(),
    initBrandsSection(),
    initCreatorsSection(),
    initTestimonialsSection(),
    initPortfolioSection(),
  ]);

  initNavigation();
  initTheme();
  initCursor();
  initHeroSection();
  initContactSection();
  initCreatorApplySection();
  initFooterSection();
  initRibbons();
  setupScrollTrigger();

  const lenis = initSmoothScroll();
  window.__lenis = lenis;

  initReveals();
  initMagneticButtons();
  initHeroParallax();
  initParallax();
  initImageReveals();
  initPageTransitions();

  await initLoader();
  playIntro();
}

document.addEventListener('DOMContentLoaded', main);
