# Dippy Studios — Website

A full multi-page marketing site for Dippy Studios, built from the brand context bible and
creative direction doc: premium editorial typography, glass navigation, an animated ribbon
motif, and a brand-partner logo wall.

## Running it

This is a static site — no build step required.

```bash
cd dippy-studios
python3 -m http.server 8000
# open http://localhost:8000
```

Just double-clicking `index.html` also works, though the brand/creator/testimonial data
(loaded via `fetch()`) needs a local server to load correctly — browsers block `fetch()`
on `file://` URLs.

## Pages

- `index.html` — homepage: loader → hero → wall of impact → brand trust → services →
  creator network → featured campaigns → statistics → testimonials → contact CTA
- `about.html` — vision, mission, values, growth timeline
- `services.html` — all six service pillars in detail
- `work.html` — filterable case-study gallery
- `creators.html` — creator directory (JSON seed data + Firestore-approved applicants) +
  application CTA
- `join.html` — public "Apply as a creator" form (photo, bio, socials) → Firestore
- `insights.html` — articles/case-study cards
- `contact.html` — inquiry form (sends via EmailJS) + direct contact details
- `admin.html` — private page for approving/rejecting creator applications (not linked
  publicly; sign in with the Firebase Authentication account you create)

## Creator applications & contact form

`join.html` and `contact.html` are wired to Firebase Firestore + EmailJS — see
**`FIREBASE_SETUP.md`** for the full setup walkthrough (~15 minutes, entirely free, no
server required). Until `js/core/config.js` is filled in, both forms show a "not
connected yet" notice instead of submitting.

The `google-apps-script/` folder is a leftover from an earlier plan and is no longer used
— safe to delete, or keep as reference.

## About the brand logos

I don't have a way to fetch and embed the real trademarked logo files for the brands you've
worked with (Mixgo, Mavo Bigwaservices, Kessgame, Mo2bet, Sokojet, Gosupa, Luminara Real
Estate, Collmarks Computers, Helabet, Tecno Kenya, Buysimu, Mbogibet, Academiasupportke).

What's here instead: clean SVG wordmark placeholders in `assets/images/brands/`, each styled
in that brand's real color (checked against public references where possible), matching the
"monochrome logos that adopt brand color on hover" spec from the brand doc.

**To swap in real logos:** replace each file in `assets/images/brands/` with the actual logo
(same filename, e.g. `tecno.svg` → `tecno.svg` or `tecno.png` — just update the `file` field
in `data/brands.json` if you change the extension). No other code changes needed — the logo
wall renders straight from that JSON file.

Same pattern applies to `assets/images/creators/` (creator photos) and
`assets/images/case-studies/` (campaign images) — all currently gradient placeholders,
all swappable by filename.

## Fonts

Space Grotesk (Google Fonts) and General Sans (Fontshare) are loaded via CDN in each page's
`<head>`. To self-host instead, see the instructions at the top of
`css/base/typography.css`.

## Stack

Semantic HTML, modular CSS (base → layout → components → pages → animations), vanilla JS
(ES modules), GSAP + ScrollTrigger, Lenis for smooth scroll. No build tools, no framework.

## Data files

Everything in `data/*.json` drives a section via `fetch()` — edit these instead of the HTML
to update brands, services, creators, testimonials, statistics, or portfolio content.
