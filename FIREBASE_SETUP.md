# Wiring up creator applications (Firebase + EmailJS)

This replaces the old Google Sheets plan. Creator applications (name, photo,
niche, bio, socials) are stored in **Firebase Firestore** (free "Spark" plan
— no billing card needed), and every new submission triggers a notification
email to you via **EmailJS** (also free, sent straight from the browser).

You review applications on a private `admin.html` page and approve or reject
them — approved creators then automatically appear on `creators.html`.

Total setup time: about 15 minutes, all free, no server to run.

---

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**.
2. Name it (e.g. "Dippy Studios"), keep the default settings, and finish creation.
3. In the project, click the **`</>`** (web) icon to register a web app. Give it a nickname — you don't need Firebase Hosting.
4. Firebase will show a `firebaseConfig` object. Copy those values into `js/core/config.js` under `FIREBASE_CONFIG` — `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

## 2. Turn on Firestore

1. In the left sidebar: **Build > Firestore Database > Create database**.
2. Choose **Start in production mode**, pick a location close to your users, and create it.
3. Go to the **Rules** tab, delete the default rules, and paste in the contents of `firestore.rules` (in this repo). Click **Publish**.

This keeps the database locked down: the public can only *create* new
pending applications and *read* approved ones — nothing else — and only a
signed-in admin can see pending applications or approve/reject/delete them.

## 3. Create your admin login

1. In the sidebar: **Build > Authentication > Get started**.
2. Enable the **Email/Password** sign-in method.
3. Go to the **Users** tab and click **Add user**. Use your own email and a password — this is what you'll use to sign in at `admin.html`.

## 4. Create your EmailJS account

1. Go to [emailjs.com](https://www.emailjs.com) and sign up for free.
2. **Email Services** > add a service (e.g. connect your Gmail) — note the **Service ID**.
3. **Email Templates** > create a template for creator applications. Use variables like `{{from_name}}`, `{{from_email}}`, `{{phone}}`, `{{niche}}`, `{{followers}}`, `{{bio}}`, `{{instagram}}`, `{{tiktok}}`, `{{youtube}}`, `{{twitter}}`, `{{facebook}}` in the body, and set **To email** to your own inbox. Note the **Template ID**.
4. Create a second template the same way for contact-form inquiries, using `{{from_name}}`, `{{from_email}}`, `{{company}}`, `{{interest}}`, `{{message}}`. Note this **Template ID** too.
5. **Account > General** — copy your **Public Key**.

## 5. Paste everything into `js/core/config.js`

Fill in the `REPLACE_ME` placeholders:

```js
export const FIREBASE_CONFIG = { apiKey: '...', authDomain: '...', projectId: '...', storageBucket: '...', messagingSenderId: '...', appId: '...' };
export const EMAILJS_PUBLIC_KEY = '...';
export const EMAILJS_SERVICE_ID = '...';
export const EMAILJS_CREATOR_TEMPLATE_ID = '...';
export const EMAILJS_CONTACT_TEMPLATE_ID = '...';
export const NOTIFY_EMAIL = 'hello@dippystudios.com'; // or wherever you want notifications
```

Save, commit, and redeploy. `join.html` and `contact.html` will now submit
for real.

## 6. Reviewing and approving applicants

- Open `yoursite.com/admin.html` and sign in with the account from step 3.
- New applications land under the **Pending** tab. Approve, reject, or delete each one.
- Approved creators appear on `creators.html` automatically on the next page load.
- **Keep the `admin.html` link private** — it's not linked from anywhere on the public site, but it isn't hidden by a server-side login wall either, just the Firebase sign-in screen. Don't share the URL publicly.

## 7. Managing Brands, Featured Work, and Client Voices

`admin.html` also has tabs for the homepage's **Brands**, **Featured Work** (campaigns),
and **Client Voices** (testimonials) sections. Each works the same way:

- **+ Add** opens a blank card to fill in and save.
- **Edit** on any existing card lets you change its fields or swap its image.
- **Delete** removes it.
- **Import existing…** copies whatever's currently in the matching `data/*.json`
  file into Firestore once, so those become editable too (safe to click more
  than once — already-imported entries are skipped).

Once something is imported or added directly, it's served from Firestore instead
of the static JSON, so there's no duplicate on the live site.

## Notes & limits

- **No billing card required.** Photos are stored as compressed base64 image data directly on the Firestore document (resized client-side to ~900px JPEG) rather than in Firebase Cloud Storage — Google now requires the paid "Blaze" plan for *any* Cloud Storage bucket, even tiny ones, so this avoids that entirely.
- **Spam:** since anyone with the `join.html` link can submit, consider Firebase App Check or a simple honeypot field if you start getting spam.
- **EmailJS free tier** caps at 200 emails/month, which is plenty for application/inquiry volume at this stage — upgrade if you outgrow it.
- The old `google-apps-script/` folder is no longer used and can be deleted, or kept as a reference.
