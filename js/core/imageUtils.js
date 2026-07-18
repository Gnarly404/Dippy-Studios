// Shared by creatorApply.js and admin.js.

export const MAX_SOURCE_FILE_MB = 8;
const MAX_OUTPUT_DIMENSION = 900;
const OUTPUT_QUALITY = 0.82;

export function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

// Photos are stored as a compressed base64 string directly on the Firestore
// document (Firestore's per-document ceiling is ~1MB, and a 900px JPEG at
// 0.82 quality is comfortably well under that) -- this avoids requiring
// Firebase's paid Blaze plan, which Cloud Storage now needs even for tiny
// projects.
export function resizeImageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.onload = () => { img.src = reader.result; };

    img.onerror = () => reject(new Error('Could not process that image file.'));
    img.onload = () => {
      const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL('image/jpeg', OUTPUT_QUALITY));
    };

    reader.readAsDataURL(file);
  });
}
