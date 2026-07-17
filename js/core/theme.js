export function initTheme() {
  const darkSections = document.querySelectorAll('[data-theme="dark"]');
  const navbar = document.querySelector('.navbar');
  if (!darkSections.length || !navbar || typeof window.IntersectionObserver === 'undefined') return;

  const logoImg = navbar.querySelector('.navbar__logo img[data-light-src]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const isDark = entry.target.dataset.theme === 'dark';
          navbar.classList.toggle('navbar--on-dark', isDark);
          if (logoImg) {
            const nextSrc = isDark ? logoImg.dataset.darkSrc : logoImg.dataset.lightSrc;
            if (nextSrc && logoImg.getAttribute('src') !== nextSrc) {
              logoImg.setAttribute('src', nextSrc);
            }
          }
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );

  darkSections.forEach((section) => observer.observe(section));
}
