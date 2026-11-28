const dialog = document.querySelector('#search');
const toggle = document.querySelector('#search-toggle');
const input = document.querySelector('#query');
const results = document.querySelector('#results');
const root = document.body.dataset.root;
let archive;
let requestNumber = 0;

function normalized(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function message(text) {
  const entry = document.createElement('li');
  entry.textContent = text;
  results.replaceChildren(entry);
}

async function search() {
  const request = ++requestNumber;
  const words = normalized(input.value).trim().split(/\s+/).filter(Boolean);
  results.replaceChildren();
  if (!words.length) return;

  try {
    archive ??= fetch(root + 'assets/index.json').then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    });
    const pages = await archive;
    if (request !== requestNumber) return;
    const matches = pages.map(page => {
      const title = normalized(page.title);
      const text = normalized(page.text);
      const score = words.reduce((count, word) => count + (title.includes(word) ? 3 : 0), 0);
      return { page, score, match: words.every(word => title.includes(word) || text.includes(word)) };
    }).filter(entry => entry.match).sort((left, right) => right.score - left.score);
    if (!matches.length) message('No matching pages.');
    for (const { page } of matches) {
      const entry = document.createElement('li');
      const link = document.createElement('a');
      link.href = root + page.path;
      link.textContent = page.title;
      entry.append(link);
      results.append(entry);
    }
  } catch {
    archive = undefined;
    if (request === requestNumber) message('Search is temporarily unavailable.');
  }
}

toggle.hidden = false;
toggle.addEventListener('click', () => {
  dialog.showModal();
  input.focus();
});
input.addEventListener('input', search);
document.addEventListener('click', event => {
  for (const menu of document.querySelectorAll('.top details[open]')) {
    if (!menu.contains(event.target)) menu.open = false;
  }
});
