/**
 * Dippy Studios — Creator Application backend
 * ---------------------------------------------------------------------
 * Deploy this as a Web App (Extensions > Apps Script, in the same Google
 * Sheet you use to store applications). Full steps in SETUP.md.
 *
 * doPost  -> receives a creator application from join.html, saves the
 *            photo to Drive, appends a row with Status = "Pending".
 * doGet   -> ?action=list returns approved creators as JSON for
 *            creators.html to render.
 */

const SHEET_NAME = 'Creators';
const PHOTO_FOLDER_NAME = 'Dippy Studios Creator Photos';

const HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Niche', 'Followers', 'Bio',
  'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'PhotoURL', 'Status',
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function getPhotoFolder_() {
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function savePhoto_(base64DataUrl, filename) {
  if (!base64DataUrl) return '';
  const commaIndex = base64DataUrl.indexOf(',');
  const meta = base64DataUrl.substring(5, commaIndex); // e.g. "image/jpeg;base64"
  const mimeType = meta.split(';')[0] || 'image/jpeg';
  const base64 = base64DataUrl.substring(commaIndex + 1);

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, filename || 'photo.jpg');

  const folder = getPhotoFolder_();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return `https://lh3.googleusercontent.com/d/${file.getId()}`;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action !== 'apply') {
      return jsonOutput_({ ok: false, error: 'Unknown action.' });
    }
    if (!body.name || !body.email || !body.bio) {
      return jsonOutput_({ ok: false, error: 'Missing required fields.' });
    }

    const photoUrl = savePhoto_(body.photoBase64, body.photoFilename);
    const socials = body.socials || {};

    getSheet_().appendRow([
      new Date(),
      body.name || '',
      body.email || '',
      body.phone || '',
      body.niche || '',
      body.followers || '',
      body.bio || '',
      socials.instagram || '',
      socials.tiktok || '',
      socials.youtube || '',
      socials.twitter || '',
      socials.facebook || '',
      photoUrl,
      'Pending',
    ]);

    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: err.message });
  }
}

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'list') {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1); // drop header row

    const approved = rows
      .filter((row) => String(row[13]).trim().toLowerCase() === 'approved')
      .map((row) => ({
        name: row[1],
        niche: row[4],
        followers: row[5],
        photo: row[12],
        socials: {
          instagram: row[7],
          tiktok: row[8],
          youtube: row[9],
          twitter: row[10],
          facebook: row[11],
        },
      }));

    return jsonOutput_(approved);
  }

  return jsonOutput_({ ok: true, message: 'Dippy Studios creator application backend is running.' });
}
