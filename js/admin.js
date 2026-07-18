import { qs, qsa } from './core/utilities.js';
import {
  getDb,
  getAuthInstance,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from './core/firebaseClient.js';
import { CREATORS_COLLECTION, BRANDS_COLLECTION, CAMPAIGNS_COLLECTION, TESTIMONIALS_COLLECTION } from './core/config.js';
import { withTimeout, resizeImageToDataURL } from './core/imageUtils.js';

function setStatus(el, message, tone) {
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone || '';
  el.hidden = !message;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

let currentTab = 'pending';
// Cache of docId -> full document data for the currently-rendered list, so
// Edit mode doesn't need a re-fetch just to populate the form.
let currentDocs = new Map();

function renderViewCard(id, c) {
  const socials = c.socials || {};
  const socialLine = Object.entries(socials)
    .filter(([, v]) => v)
    .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
    .join(' · ');

  return `
  <article class="admin-card admin-application" data-id="${id}">
    <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" class="admin-application__photo">
    <div class="admin-application__body">
      <h3>${escapeHtml(c.name)}</h3>
      <p class="mono-label">${escapeHtml(c.email)} ${c.phone ? '· ' + escapeHtml(c.phone) : ''}</p>
      <p class="mono-label">${escapeHtml(c.niche)} · ${escapeHtml(c.followers)} followers</p>
      <p>${escapeHtml(c.bio)}</p>
      ${socialLine ? `<p class="mono-label">${socialLine}</p>` : ''}
    </div>
    <div class="admin-application__actions">
      ${currentTab !== 'approved' ? '<button type="button" class="btn btn--primary btn--sm" data-action="approved">Approve</button>' : ''}
      ${currentTab !== 'rejected' ? '<button type="button" class="btn btn--ghost btn--sm" data-action="rejected">Reject</button>' : ''}
      <button type="button" class="btn btn--ghost btn--sm" data-action="edit">Edit</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="delete">Delete</button>
    </div>
  </article>`;
}

function renderEditCard(id, c) {
  const socials = c.socials || {};
  return `
  <article class="admin-card admin-application admin-application--editing" data-id="${id}">
    <div class="admin-edit-form">
      <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" class="admin-application__photo" data-edit-photo-preview>
      <label>Replace photo
        <input type="file" accept="image/*" data-edit-photo-input>
      </label>
      <label>Name
        <input type="text" data-edit-field="name" value="${escapeHtml(c.name)}">
      </label>
      <label>Niche
        <input type="text" data-edit-field="niche" value="${escapeHtml(c.niche)}">
      </label>
      <label>Followers
        <input type="text" data-edit-field="followers" value="${escapeHtml(c.followers)}">
      </label>
      <label>Email
        <input type="text" data-edit-field="email" value="${escapeHtml(c.email)}">
      </label>
      <label>Phone
        <input type="text" data-edit-field="phone" value="${escapeHtml(c.phone)}">
      </label>
      <label>Bio
        <textarea data-edit-field="bio">${escapeHtml(c.bio)}</textarea>
      </label>
      <label>Instagram
        <input type="text" data-edit-social="instagram" value="${escapeHtml(socials.instagram)}">
      </label>
      <label>TikTok
        <input type="text" data-edit-social="tiktok" value="${escapeHtml(socials.tiktok)}">
      </label>
      <label>YouTube
        <input type="text" data-edit-social="youtube" value="${escapeHtml(socials.youtube)}">
      </label>
      <label>X / Twitter
        <input type="text" data-edit-social="twitter" value="${escapeHtml(socials.twitter)}">
      </label>
      <label>Facebook
        <input type="text" data-edit-social="facebook" value="${escapeHtml(socials.facebook)}">
      </label>
      <div class="form-status" data-edit-status role="status" aria-live="polite" hidden></div>
      <div class="admin-application__actions">
        <button type="button" class="btn btn--primary btn--sm" data-action="save-edit">Save</button>
        <button type="button" class="btn btn--ghost btn--sm" data-action="cancel-edit">Cancel</button>
      </div>
    </div>
  </article>`;
}

async function loadApplications() {
  const grid = qs('[data-applications-grid]');
  const listStatus = qs('[data-list-status]');
  setStatus(listStatus, 'Loading…', 'info');
  grid.innerHTML = '';
  currentDocs = new Map();

  try {
    const q = query(
      collection(getDb(), CREATORS_COLLECTION),
      where('status', '==', currentTab),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      setStatus(listStatus, `No ${currentTab} applications right now.`, 'info');
      return;
    }
    setStatus(listStatus, '', '');

    snap.docs.forEach((d) => currentDocs.set(d.id, d.data()));

    grid.innerHTML = snap.docs
      .map((d) => renderViewCard(d.id, d.data()))
      .join('');
  } catch (err) {
    setStatus(listStatus, `Couldn\u2019t load applications: ${err.message}`, 'error');
  }
}

function switchToEdit(card, id) {
  const c = currentDocs.get(id);
  if (!c) return;
  card.outerHTML = renderEditCard(id, c);

  const newCard = qs(`[data-id="${id}"]`);
  const photoInput = qs('[data-edit-photo-input]', newCard);
  const photoPreview = qs('[data-edit-photo-preview]', newCard);
  let newPhotoDataURL = null;

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    try {
      newPhotoDataURL = await resizeImageToDataURL(file);
      photoPreview.src = newPhotoDataURL;
    } catch (err) {
      alert(err.message);
    }
  });

  qs('[data-action="save-edit"]', newCard).addEventListener('click', async () => {
    const saveBtn = qs('[data-action="save-edit"]', newCard);
    const statusEl = qs('[data-edit-status]', newCard);
    saveBtn.disabled = true;
    setStatus(statusEl, 'Saving…', 'info');

    const updates = {};
    qsa('[data-edit-field]', newCard).forEach((input) => {
      updates[input.dataset.editField] = input.value.trim();
    });
    const socials = {};
    qsa('[data-edit-social]', newCard).forEach((input) => {
      socials[input.dataset.editSocial] = input.value.trim();
    });
    updates.socials = socials;
    if (newPhotoDataURL) updates.photo = newPhotoDataURL;

    try {
      await withTimeout(
        updateDoc(doc(getDb(), CREATORS_COLLECTION, id), updates),
        15000,
        'Saving changes'
      );
      const merged = { ...c, ...updates };
      currentDocs.set(id, merged);
      newCard.outerHTML = renderViewCard(id, merged);
    } catch (err) {
      setStatus(statusEl, `Couldn\u2019t save: ${err.message}`, 'error');
      saveBtn.disabled = false;
    }
  });

  qs('[data-action="cancel-edit"]', newCard).addEventListener('click', () => {
    newCard.outerHTML = renderViewCard(id, c);
  });
}

function bindGridActions() {
  const grid = qs('[data-applications-grid]');
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    const id = card.dataset.id;
    const action = btn.dataset.action;

    if (action === 'edit') {
      switchToEdit(card, id);
      return;
    }
    if (action === 'save-edit' || action === 'cancel-edit') return; // handled in switchToEdit

    btn.disabled = true;
    try {
      if (action === 'delete') {
        if (!confirm('Delete this application permanently?')) { btn.disabled = false; return; }
        await deleteDoc(doc(getDb(), CREATORS_COLLECTION, id));
      } else {
        await updateDoc(doc(getDb(), CREATORS_COLLECTION, id), { status: action });
      }
      card.remove();
      currentDocs.delete(id);
    } catch (err) {
      alert(`That didn\u2019t work: ${err.message}`);
      btn.disabled = false;
    }
  });
}

async function importSeedCreators() {
  const btn = qs('[data-import-seed-btn]');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Importing…';

  try {
    const seed = await fetch('data/creators.json').then((r) => r.json());

    // Skip any that are already imported (checked by name, tagged source: 'seed').
    const existingSnap = await getDocs(
      query(collection(getDb(), CREATORS_COLLECTION), where('source', '==', 'seed'))
    );
    const alreadyImported = new Set(existingSnap.docs.map((d) => d.data().name));

    let count = 0;
    for (const c of seed) {
      if (alreadyImported.has(c.name)) continue;
      await addDoc(collection(getDb(), CREATORS_COLLECTION), {
        name: c.name,
        niche: c.niche,
        followers: c.followers,
        photo: c.photo,
        email: '',
        phone: '',
        bio: '',
        socials: {},
        status: 'approved',
        source: 'seed',
        createdAt: serverTimestamp(),
      });
      count += 1;
    }

    btn.textContent = count > 0 ? `Imported ${count}` : 'Already imported';
    if (currentTab === 'approved') loadApplications();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function bindTabs() {
  qsa('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('.admin-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentTab = tab.dataset.tab;
      loadApplications();
    });
  });
}

function showApp() {
  qs('[data-login-panel]').hidden = true;
  qs('[data-app-panel]').hidden = false;
  qs('[data-signout-btn]').hidden = false;
  loadApplications();
}

function showLogin() {
  qs('[data-login-panel]').hidden = false;
  qs('[data-app-panel]').hidden = true;
  qs('[data-signout-btn]').hidden = true;
}

function initAuth() {
  const auth = getAuthInstance();
  const loginForm = qs('[data-login-form]');
  const loginStatus = qs('[data-login-status]');
  const signOutBtn = qs('[data-signout-btn]');

  onAuthStateChanged(auth, (user) => {
    if (user) showApp();
    else showLogin();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(loginForm);
    const email = (data.get('email') || '').toString().trim();
    const password = (data.get('password') || '').toString();

    setStatus(loginStatus, 'Signing in…', 'info');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setStatus(loginStatus, `Couldn\u2019t sign in: ${err.message}`, 'error');
    }
  });

  signOutBtn.addEventListener('click', () => signOut(auth));
}

initAuth();
bindTabs();
bindGridActions();
qs('[data-import-seed-btn]').addEventListener('click', importSeedCreators);

// ---------------------------------------------------------------------------
// Generic content manager: Brands, Featured Work (campaigns), Client Voices
// (testimonials). Each is a flat Firestore collection with no approval
// workflow — admin adds/edits/deletes directly.
// ---------------------------------------------------------------------------

const CONTENT_TYPES = {
  brands: {
    collection: BRANDS_COLLECTION,
    seedFile: 'data/brands.json',
    imageField: 'logo',
    dedupeKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'color', label: 'Accent color (hex, e.g. #FF7A00)', type: 'text' },
    ],
    seedToDoc: (c) => ({
      name: c.name,
      color: c.color || '',
      logo: c.logo || `assets/images/brands/${c.file}`,
    }),
  },
  campaigns: {
    collection: CAMPAIGNS_COLLECTION,
    seedFile: 'data/portfolio.json',
    imageField: 'image',
    dedupeKey: 'title',
    fields: [
      { key: 'client', label: 'Client', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'link', label: 'Link (optional, defaults to work.html)', type: 'text' },
    ],
    seedToDoc: (c) => ({
      client: c.client,
      title: c.title,
      link: c.link || '',
      image: c.image,
    }),
  },
  testimonials: {
    collection: TESTIMONIALS_COLLECTION,
    seedFile: 'data/testimonials.json',
    imageField: 'avatar',
    dedupeKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role / company', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea' },
    ],
    seedToDoc: (c) => ({
      name: c.name,
      role: c.role,
      quote: c.quote,
      avatar: c.avatar,
    }),
  },
};

const contentDocs = { brands: new Map(), campaigns: new Map(), testimonials: new Map() };
const contentLoaded = { brands: false, campaigns: false, testimonials: false };

function renderContentViewCard(type, id, c) {
  const cfg = CONTENT_TYPES[type];
  const fieldsHtml = cfg.fields
    .map((f) => `<p class="mono-label">${escapeHtml(f.label)}: ${escapeHtml(c[f.key])}</p>`)
    .join('');

  return `
  <article class="admin-card admin-application" data-id="${id}" data-content-type="${type}">
    <img src="${escapeHtml(c[cfg.imageField])}" alt="${escapeHtml(c.name || c.title || '')}" class="admin-application__photo">
    <div class="admin-application__body">
      ${fieldsHtml}
    </div>
    <div class="admin-application__actions">
      <button type="button" class="btn btn--ghost btn--sm" data-content-action="edit">Edit</button>
      <button type="button" class="btn btn--ghost btn--sm" data-content-action="delete">Delete</button>
    </div>
  </article>`;
}

function renderContentEditCard(type, id, c) {
  const cfg = CONTENT_TYPES[type];
  const fieldsHtml = cfg.fields
    .map((f) => {
      const val = escapeHtml(c[f.key] ?? '');
      return f.type === 'textarea'
        ? `<label>${escapeHtml(f.label)}<textarea data-edit-content-field="${f.key}">${val}</textarea></label>`
        : `<label>${escapeHtml(f.label)}<input type="text" data-edit-content-field="${f.key}" value="${val}"></label>`;
    })
    .join('');

  return `
  <article class="admin-card admin-application admin-application--editing" data-id="${id}" data-content-type="${type}">
    <div class="admin-edit-form">
      <img src="${escapeHtml(c[cfg.imageField] || '')}" alt="" class="admin-application__photo" data-edit-content-photo-preview>
      <label>Replace image
        <input type="file" accept="image/*" data-edit-content-photo-input>
      </label>
      ${fieldsHtml}
      <div class="form-status" data-edit-content-status role="status" aria-live="polite" hidden></div>
      <div class="admin-application__actions">
        <button type="button" class="btn btn--primary btn--sm" data-content-action="save-edit">Save</button>
        <button type="button" class="btn btn--ghost btn--sm" data-content-action="cancel-edit">Cancel</button>
      </div>
    </div>
  </article>`;
}

async function loadContentList(type) {
  const cfg = CONTENT_TYPES[type];
  const grid = qs(`[data-content-grid="${type}"]`);
  const statusEl = qs(`[data-content-status="${type}"]`);
  setStatus(statusEl, 'Loading…', 'info');
  grid.innerHTML = '';
  contentDocs[type] = new Map();

  try {
    const snap = await getDocs(collection(getDb(), cfg.collection));
    if (snap.empty) {
      setStatus(statusEl, 'Nothing here yet — add one, or import the existing entries.', 'info');
      return;
    }
    setStatus(statusEl, '', '');
    snap.docs.forEach((d) => contentDocs[type].set(d.id, d.data()));
    grid.innerHTML = snap.docs.map((d) => renderContentViewCard(type, d.id, d.data())).join('');
  } catch (err) {
    setStatus(statusEl, `Couldn\u2019t load: ${err.message}`, 'error');
  }
}

function switchContentToEdit(type, card, id) {
  const cfg = CONTENT_TYPES[type];
  const c = contentDocs[type].get(id) || {};
  card.outerHTML = renderContentEditCard(type, id, c);

  const newCard = qs(`[data-content-type="${type}"][data-id="${id}"]`);
  const photoInput = qs('[data-edit-content-photo-input]', newCard);
  const photoPreview = qs('[data-edit-content-photo-preview]', newCard);
  let newImageDataURL = null;

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    try {
      newImageDataURL = await resizeImageToDataURL(file);
      photoPreview.src = newImageDataURL;
    } catch (err) {
      alert(err.message);
    }
  });

  qs('[data-content-action="save-edit"]', newCard).addEventListener('click', async () => {
    const saveBtn = qs('[data-content-action="save-edit"]', newCard);
    const statusEl = qs('[data-edit-content-status]', newCard);
    saveBtn.disabled = true;
    setStatus(statusEl, 'Saving…', 'info');

    const updates = {};
    qsa('[data-edit-content-field]', newCard).forEach((input) => {
      updates[input.dataset.editContentField] = input.value.trim();
    });
    if (newImageDataURL) updates[cfg.imageField] = newImageDataURL;

    try {
      if (id.startsWith('__new__')) {
        const ref = await withTimeout(
          addDoc(collection(getDb(), cfg.collection), updates),
          15000,
          'Saving'
        );
        contentDocs[type].delete(id);
        contentDocs[type].set(ref.id, updates);
        newCard.outerHTML = renderContentViewCard(type, ref.id, updates);
      } else {
        await withTimeout(
          updateDoc(doc(getDb(), cfg.collection, id), updates),
          15000,
          'Saving'
        );
        const merged = { ...c, ...updates };
        contentDocs[type].set(id, merged);
        newCard.outerHTML = renderContentViewCard(type, id, merged);
      }
    } catch (err) {
      setStatus(statusEl, `Couldn\u2019t save: ${err.message}`, 'error');
      saveBtn.disabled = false;
    }
  });

  qs('[data-content-action="cancel-edit"]', newCard).addEventListener('click', () => {
    if (id.startsWith('__new__')) {
      contentDocs[type].delete(id);
      newCard.remove();
    } else {
      newCard.outerHTML = renderContentViewCard(type, id, c);
    }
  });
}

function bindContentGridActions(type) {
  const grid = qs(`[data-content-grid="${type}"]`);
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-content-action]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    const id = card.dataset.id;
    const action = btn.dataset.contentAction;

    if (action === 'edit') {
      switchContentToEdit(type, card, id);
      return;
    }
    if (action === 'save-edit' || action === 'cancel-edit') return; // handled in switchContentToEdit

    if (action === 'delete') {
      if (!confirm('Delete this entry permanently?')) return;
      btn.disabled = true;
      try {
        await deleteDoc(doc(getDb(), CONTENT_TYPES[type].collection, id));
        contentDocs[type].delete(id);
        card.remove();
      } catch (err) {
        alert(`That didn\u2019t work: ${err.message}`);
        btn.disabled = false;
      }
    }
  });
}

function addNewContentItem(type) {
  const grid = qs(`[data-content-grid="${type}"]`);
  const tempId = `__new__${Date.now()}`;
  const blank = {};
  contentDocs[type].set(tempId, blank);
  grid.insertAdjacentHTML('afterbegin', renderContentEditCard(type, tempId, blank));
  const card = qs(`[data-content-type="${type}"][data-id="${tempId}"]`);
  switchContentToEdit(type, card, tempId);
}

async function importContentSeed(type) {
  const cfg = CONTENT_TYPES[type];
  const btn = qs(`[data-content-import="${type}"]`);
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Importing…';

  try {
    const seed = await fetch(cfg.seedFile).then((r) => r.json());
    const existingSnap = await getDocs(
      query(collection(getDb(), cfg.collection), where('source', '==', 'seed'))
    );
    const alreadyImported = new Set(existingSnap.docs.map((d) => d.data()[cfg.dedupeKey]));

    let count = 0;
    for (const item of seed) {
      if (alreadyImported.has(item[cfg.dedupeKey])) continue;
      await addDoc(collection(getDb(), cfg.collection), {
        ...cfg.seedToDoc(item),
        source: 'seed',
        createdAt: serverTimestamp(),
      });
      count += 1;
    }

    btn.textContent = count > 0 ? `Imported ${count}` : 'Already imported';
    loadContentList(type);
  } catch (err) {
    alert(`Import failed: ${err.message}`);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function initContentManagers() {
  Object.keys(CONTENT_TYPES).forEach((type) => {
    bindContentGridActions(type);
    qs(`[data-content-add="${type}"]`).addEventListener('click', () => addNewContentItem(type));
    qs(`[data-content-import="${type}"]`).addEventListener('click', () => importContentSeed(type));
  });
}

function initSectionSwitcher() {
  qsa('.admin-section-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('.admin-section-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const section = tab.dataset.section;

      qsa('[data-section-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.sectionPanel !== section;
      });

      if (section !== 'applications' && !contentLoaded[section]) {
        contentLoaded[section] = true;
        loadContentList(section);
      }
    });
  });
}

initContentManagers();
initSectionSwitcher();
