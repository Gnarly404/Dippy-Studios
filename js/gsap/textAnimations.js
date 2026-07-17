export function splitTextLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = '';
  words.forEach((word, i) => {
    const line = document.createElement('span');
    line.className = 'line';
    const inner = document.createElement('span');
    inner.textContent = word + (i < words.length - 1 ? '\u00A0' : '');
    line.appendChild(inner);
    el.appendChild(line);
  });
}

export function initSplitText() {
  document.querySelectorAll('[data-split-text]').forEach(splitTextLines);
}
