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
import { CREATORS_COLLECTION } from './core/config.js';
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
