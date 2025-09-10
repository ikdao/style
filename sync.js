async function getMe() {
  const res = await fetch('/rest/i/me', {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return await res.json();
}

async function patchMe(updates) {
  const res = await fetch('/rest/i/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return await res.json();
}

// --- fill helpers ---
function fillElement(el, val) {
  if (el.dataset.attr) {
    el.dataset.attr.split(',').forEach(attr => {
      el.setAttribute(attr.trim(), val);
    });
  } else if (el.type === 'checkbox') {
    el.checked = !!val && val !== '0' && val !== 'false';
  } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
    el.value = val ?? '';
  } else {
    el.textContent = val ?? '';
  }
}

function fillDom(container, data) {
  container.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (!(key in data)) return;
    const val = data[key] ?? '';
    fillElement(el, val);
  });
}

// --- list field helpers (dash-separated IDs) ---
function normalizeListString(str) {
  return str
    .split('-')
    .map(s => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('-');
}

// --- hydration config ---
const hydrateConfig = {
  ulang: { api: '/rest/i/language', labelField: 'title' },
  unation: { api: '/rest/i/itx', labelField: 'title' }
};

const hydrateCache = {};

async function fetchHydrate(api, ids) {
  const key = api + ':' + ids.sort().join(',');
  if (hydrateCache[key]) return hydrateCache[key];

  const url = `${api}?id=${ids.join(',')}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Hydrate fetch failed');
  const json = await res.json();

  hydrateCache[key] = json;
  return json;
}

async function hydrateField(field, ids, els) {
  const cfg = hydrateConfig[field];
  if (!cfg) return;

  try {
    const data = await fetchHydrate(cfg.api, ids);
    if (!data.success || !data.results) return;

    const map = {};
    data.results.forEach(r => {
      const id = r.id || r.slug;
      map[id] = r[cfg.labelField] || id;
    });

    els.forEach(el => {
      const val = el.dataset.value || el.textContent || '';
      const hydrated = val
        .split('-')
        .map(v => map[v] || v)
        .join(', ');
      el.textContent = hydrated;
    });
  } catch (err) {
    console.error('Hydrate error', err);
  }
}

async function hydrateDom(container, data) {
  for (const field in hydrateConfig) {
    const els = Array.from(container.querySelectorAll(`[data-key="${field}"]`));
    if (!els.length) continue;

    const ids = [];
    els.forEach(el => {
      const val = data[field] || el.dataset.value || '';
      val.split('-').filter(Boolean).forEach(v => {
        if (!ids.includes(v)) ids.push(v);
      });
    });

    if (ids.length) await hydrateField(field, ids, els);
  }
}

// --- sync field helpers ---
async function syncField(field, value) {
  const updates = {};
  updates[field] = value;
  const res = await patchMe(updates);
  if (res.success) {
    const { me } = await getMe();
    fillDom(document, me);
    await hydrateDom(document, me);
  } else {
    console.warn('Sync failed', res);
  }
}

// --- bootstrap ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { me } = await getMe();
    fillDom(document, me);
    await hydrateDom(document, me);
  } catch (err) {
    console.error('Error loading profile', err);
    return;
  }

  // single-value sync
  document.querySelectorAll('[sync]').forEach(el => {
    const field = el.getAttribute('name') || el.dataset.key;
    if (!field) return;

    if (el.type === 'checkbox') {
      el.addEventListener('change', () => {
        syncField(field, el.checked ? 1 : 0);
      });
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.addEventListener('change', () => {
        syncField(field, el.value || null);
      });
    } else {
      el.addEventListener('click', () => {
        const value = el.dataset.value ?? true;
        syncField(field, value);
      });
    }
  });

  // list-value sync (dash-separated IDs)
  document.querySelectorAll('[syncs]').forEach(el => {
    const field = el.getAttribute('name') || el.dataset.key;
    const value = el.dataset.value;
    if (!field || !value) return;

    el.addEventListener('click', async () => {
      try {
        const { me } = await getMe();
        const current = me[field] || '';
        const arr = current ? current.split('-').filter(Boolean) : [];
        const idx = arr.indexOf(value);

        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(value);

        const updated = normalizeListString(arr.join('-'));
        await syncField(field, updated);
      } catch (err) {
        console.error('List sync failed', err);
      }
    });
  });
});
