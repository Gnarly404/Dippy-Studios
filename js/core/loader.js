import { prefersReducedMotion } from './utilities.js';

const SESSION_KEY = 'dippyStudiosLoaderPlayed';
// D → DI → DIP → DIPPY → DIPPY STUDIOS
const WORD_STAGES = ['D', 'DI', 'DIP', 'DIPPY', 'DIPPY STUDIOS'];
const STAGE_MS = 260;

function finishLoader(loader, resolve) {
  if (loader.classList.contains('is-done')) return;
  loader.classList.add('is-done');
  loader.style.transition = 'opacity 0.5s ease, transform 0.6s var(--ease-out-expo, ease)';
  loader.style.opacity = '0';
  loader.style.transform = 'translateY(-100%)';
  document.body.classList.remove('no-scroll');
  setTimeout(() => {
    loader.style.display = 'none';
    resolve();
  }, 550);
}

export function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return Promise.resolve();

  const word = loader.querySelector('.loader__word');
  const bar = loader.querySelector('.loader__bar span');
  const count = loader.querySelector('.loader__count');
  const caption = loader.querySelector('.loader__caption');

  const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';

  if (prefersReducedMotion() || alreadyPlayed) {
    loader.classList.add('is-done');
    loader.style.display = 'none';
    document.body.classList.remove('no-scroll');
    sessionStorage.setItem(SESSION_KEY, '1');
    return Promise.resolve();
  }

  sessionStorage.setItem(SESSION_KEY, '1');
  document.body.classList.add('no-scroll');

  return new Promise((resolve) => {
    let stage = 0;
    let done = false;
    let skipTimer = null;

    const skip = () => {
      if (done) return;
      done = true;
      clearTimeout(skipTimer);
      if (word) word.textContent = WORD_STAGES[WORD_STAGES.length - 1];
      if (bar) bar.style.width = '100%';
      if (count) count.textContent = '100%';
      finishLoader(loader, resolve);
    };

    // Skippable: tap/click anywhere on the loader, or Esc.
    loader.addEventListener('click', skip);
    const escHandler = (e) => {
      if (e.key === 'Escape') skip();
    };
    document.addEventListener('keydown', escHandler);

    const advance = () => {
      if (done) return;
      if (word) word.textContent = WORD_STAGES[stage];
      const pct = Math.round(((stage + 1) / WORD_STAGES.length) * 100);
      if (bar) bar.style.width = `${pct}%`;
      if (count) count.textContent = `${pct}%`;

      // A quiet, one-time beat of Dippy's comedic lineage — not a joke,
      // just a wink, gone before it can undercut the cinematic tone.
      if (stage === WORD_STAGES.length - 2 && caption) {
        caption.classList.add('is-visible');
      }

      stage += 1;
      if (stage < WORD_STAGES.length) {
        skipTimer = setTimeout(advance, STAGE_MS);
      } else {
        skipTimer = setTimeout(() => {
          done = true;
          document.removeEventListener('keydown', escHandler);
          finishLoader(loader, resolve);
        }, 420);
      }
    };

    advance();
  });
}
