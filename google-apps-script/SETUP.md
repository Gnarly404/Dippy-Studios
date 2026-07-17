# Wiring up the creator application form

This connects `join.html` to a free Google Sheet so applications actually get
stored somewhere, with photos saved to Drive — no server or hosting needed.
Takes about 10 minutes.

## 1. Create the sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **Dippy Studios — Creator Applications**.
3. You don't need to add headers manually — the script creates them the first time it runs.

## 2. Add the script

1. In the sheet, go to **Extensions → Apps Script**.
2. Delete anything in the default `Code.gs` file.
3. Copy the entire contents of `Code.gs` (in this folder) and paste it in.
4. Click the disk icon (or Ctrl/Cmd+S) to save. Give the project a name if asked.

## 3. Deploy it as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. The first time, Google will ask you to authorize the script — click through
   the consent screens (it'll warn the app isn't verified since you wrote it
   yourself; click "Advanced" → "Go to [project name] (unsafe)" to proceed).
6. Copy the **Web app URL** it gives you — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Connect it to the site

1. Open `js/core/config.js` in the site files.
2. Paste the URL in:
   ```js
   export const CREATOR_APPLY_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
3. Save, redeploy/upload the site. The `join.html` form will now submit for real,
   and `creators.html` will start pulling in anyone marked "Approved."

## 5. Test it

- Open the Web app URL directly in a browser — you should see a small JSON
  message confirming it's running.
- Submit a test application on `join.html`. A new row should appear in your
  sheet within a few seconds, with **Status = Pending**.
- The photo gets uploaded to a Drive folder called **Dippy Studios Creator
  Photos** (created automatically), and the sheet stores a link to it.

## 6. Reviewing and approving applicants

Every submission lands with `Status = Pending` so nothing shows on the public
site automatically. To publish someone:

1. Open the sheet.
2. Find their row, and change the **Status** column to `Approved` (exact spelling
   doesn't matter for case, but the word must be "Approved").
3. Refresh `creators.html` — they'll now appear in the creator grid, alongside
   the ones already in `data/creators.json`.

To remove or hide someone later, change their Status to anything else (e.g.
`Rejected`) and they'll disappear from the site on the next page load.

## Notes & limits

- **No login required to apply** — anyone with the `join.html` link can submit.
  If you start getting spam, consider adding a simple honeypot field or
  switching "Who has access" review periodically.
- **Redeploy after script edits.** If you change `Code.gs` later, use
  **Deploy → Manage deployments → Edit → New version** so the live URL picks
  up your changes.
- **Photo hosting via Drive works well for a small creator directory.** If you
  outgrow it or see broken images, the cleanest upgrade is swapping the photo
  storage for something like Cloudinary — ask me and I can wire that in.
