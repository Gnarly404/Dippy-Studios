// Applicants type all sorts of things into the social fields -- a bare
// handle ("dippycomedy"), a handle with "@" ("@dippycomedy"), or a full
// URL they copy-pasted. This turns whatever they gave us into an actual
// clickable link to their profile.

const PLATFORM_BASE = {
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/@',
  youtube: 'https://youtube.com/@',
  twitter: 'https://x.com/',
  facebook: 'https://www.facebook.com/',
};

export function socialLinkFor(platform, rawValue) {
  const value = (rawValue || '').toString().trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;

  const handle = value.replace(/^@/, '').replace(/\/+$/, '');
  const base = PLATFORM_BASE[platform];
  if (!base) return null;

  return base + handle;
}

export const PLATFORM_LABEL = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
};
