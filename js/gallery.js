/* ============================================================
   GALLERY PAGE — JavaScript
   Loads images dynamically from _data/gallery.json
   + any CMS-added photos from _data/photos/ via GitHub API
   ============================================================ */

'use strict';

/* ─── Size variants cycled for visual variety ─────────────── */
const SIZE_CYCLE = ['tall', 'square', 'wide', 'short', 'tall', 'square', 'short', 'wide'];

/* ─── Category label map ──────────────────────────────────── */
const CATEGORY_LABELS = {
  worship:     'Worship',
  sunday:      'Sunday Services',
  community:   'Community',
  youth:       'Youth',
  outreach:    'Outreach',
  conferences: 'Conferences',
};

/* ─── Repo config ─────────────────────────────────────────── */
const GITHUB_REPO = 'wizzidom/armofgod3.0';

/* ─── Site base path ──────────────────────────────────────────
   Custom domain armofgod.tv serves from root — no subfolder.
   ─────────────────────────────────────────────────────────── */
const SITE_BASE = '';

/* ============================================================
   MAIN ENTRY POINT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender();
});

/* ============================================================
   LOAD & RENDER
   1. Fetch _data/gallery.json (original migrated photos)
   2. Fetch _data/photos/*.json via GitHub API (CMS-added photos)
   3. Merge, render, boot interactivity
   ============================================================ */
async function loadAndRender() {
  const grid    = document.getElementById('galleryGrid');
  const countEl = document.getElementById('galleryCountNum');
  if (!grid) return;

  grid.innerHTML = buildLoadingSkeleton();

  let photos = [];

  /* ── Photos from _data/photos/ (added via CMS admin) ──── */
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/_data/photos`;
    const res    = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (res.ok) {
      const files = await res.json();
      if (Array.isArray(files)) {
        const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.name !== '.gitkeep');
        const fetches   = jsonFiles.map(f =>
          fetch(f.download_url)
            .then(r => r.json())
            .catch(() => null)
        );
        const results = await Promise.all(fetches);
        results.forEach(p => { if (p && p.src) photos.push(p); });
      }
    }
  } catch (err) {
    console.warn('[Gallery] CMS photos fetch failed:', err);
  }

  /* ── 3. Render ─────────────────────────────────────────── */
  if (photos.length === 0) {
    grid.innerHTML = buildErrorState('No photos found in the gallery yet.');
    return;
  }

  grid.innerHTML = photos.map((photo, i) => buildCard(photo, i)).join('');
  if (countEl) countEl.textContent = photos.length;
  initInteractivity(grid);
}

/* ============================================================
   BUILD A SINGLE GALLERY CARD
   ============================================================ */
function buildCard(photo, index) {
  const sizeClass   = SIZE_CYCLE[index % SIZE_CYCLE.length];
  const catLabel    = CATEGORY_LABELS[photo.category] || photo.category || 'General';
  const src         = resolveSrc(photo.src);
  const title       = escapeHtml(photo.title       || 'Untitled');
  const description = escapeHtml(photo.description || '');

  return `
    <a href="${src}"
       class="gallery-card gallery-card--${sizeClass} glightbox"
       data-category="${escapeHtml(photo.category || 'general')}"
       data-glightbox="title: ${title}; description: ${description}"
       role="listitem"
       aria-label="${title} photo">
      <img src="${src}" alt="${title}" loading="lazy" />
      <div class="gallery-card-overlay">
        <div class="gallery-card-info">
          <div class="gallery-card-cat">${escapeHtml(catLabel)}</div>
          <div class="gallery-card-title">${title}</div>
        </div>
      </div>
      <div class="gallery-card-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
    </a>
  `;
}

/* ============================================================
   RESOLVE IMAGE SRC
   Handles three cases:
   1. Full URL (http/https)       → used as-is
   2. Absolute path (/assets/...) → prepend SITE_BASE
   3. Bare filename (10.jpeg)     → prepend SITE_BASE/
   ============================================================ */
function resolveSrc(src) {
  if (!src) return '';

  // Full external URL — use as-is
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  // Strip any leading ../ the CMS may have stored
  const clean = src.replace(/^(\.\.\/)+/, '');

  // Already has the site base prefix — use as-is
  if (clean.startsWith(SITE_BASE + '/') || clean === SITE_BASE) return clean;

  // Absolute path like /assets/gallery/photo.jpg — prepend site base
  if (clean.startsWith('/')) return `${SITE_BASE}${clean}`;

  // Bare filename like 10.jpeg or assets/gallery/photo.jpg
  return `${SITE_BASE}/${clean}`;
}

/* ============================================================
   INTERACTIVITY — filter, search, view toggle, lightbox, etc.
   ============================================================ */
function initInteractivity(grid) {
  const filterTabs  = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('gallerySearch');
  const countEl     = document.getElementById('galleryCountNum');
  const emptyState  = document.getElementById('galleryEmpty');
  const viewBtns    = document.querySelectorAll('.view-btn');
  const filterBar   = document.getElementById('galleryFilterBar');
  const allCards    = Array.from(grid.querySelectorAll('.gallery-card'));

  let currentFilter = 'all';
  let searchQuery   = '';
  let lightbox      = null;

  /* ─── GLightbox ─────────────────────────────────────────── */
  function initLightbox() {
    if (lightbox) lightbox.destroy();
    if (typeof GLightbox === 'undefined') return;
    lightbox = GLightbox({
      selector:        '.gallery-card.glightbox:not(.hidden)',
      touchNavigation: true,
      loop:            true,
      closeEffect:     'fade',
      openEffect:      'zoom',
      skin:            'clean',
      descPosition:    'bottom',
    });
  }

  initLightbox();

  /* ─── Filter / search ───────────────────────────────────── */
  function applyFilter() {
    let visible = 0;
    allCards.forEach(card => {
      const cat      = (card.dataset.category || '').toLowerCase();
      const titleEl  = card.querySelector('.gallery-card-title');
      const catEl    = card.querySelector('.gallery-card-cat');
      const combined = [cat,
        titleEl ? titleEl.textContent.toLowerCase() : '',
        catEl   ? catEl.textContent.toLowerCase()   : '',
      ].join(' ');

      const matchFilter = currentFilter === 'all' || cat === currentFilter;
      const matchSearch = !searchQuery || combined.includes(searchQuery);

      if (matchFilter && matchSearch) {
        card.classList.remove('hidden');
        card.classList.add('fade-in');
        setTimeout(() => card.classList.remove('fade-in'), 500);
        visible++;
      } else {
        card.classList.add('hidden');
        card.classList.remove('fade-in');
      }
    });

    if (countEl)    countEl.textContent = visible;
    if (emptyState) emptyState.classList.toggle('visible', visible === 0);
    initLightbox();
  }

  /* ─── Filter tabs ───────────────────────────────────────── */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.dataset.filter || 'all';
      applyFilter();
    });
  });

  /* ─── Search ────────────────────────────────────────────── */
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchQuery = searchInput.value.toLowerCase().trim();
        applyFilter();
      }, 250);
    });
  }

  /* ─── View toggle ───────────────────────────────────────── */
  if (viewBtns.length) {
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        grid.className = 'gallery-grid';
        if (btn.dataset.cols === '3') grid.classList.add('view-3');
        if (btn.dataset.cols === '2') grid.classList.add('view-2');
      });
    });
  }

  /* ─── Sticky filter bar ─────────────────────────────────── */
  if (filterBar) {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80');
    new IntersectionObserver(
      ([e]) => filterBar.classList.toggle('is-stuck', !e.isIntersecting),
      { threshold: 1, rootMargin: `-${navH}px 0px 0px 0px` }
    ).observe(filterBar);
  }

  /* ─── Card hover parallax ───────────────────────────────── */
  allCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      const img = card.querySelector('img');
      if (img) img.style.transform = `scale(1.08) translate(${x * 8}px, ${y * 8}px)`;
    });
    card.addEventListener('mouseleave', () => {
      const img = card.querySelector('img');
      if (img) img.style.transform = '';
    });
  });

  /* ─── GSAP entrance ─────────────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.fromTo(allCards,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: { amount: 0.8 }, ease: 'power2.out',
        scrollTrigger: { trigger: grid, start: 'top 85%', once: true } }
    );
  }

  applyFilter();
}

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildLoadingSkeleton() {
  return Array.from({ length: 6 }).map((_, i) =>
    `<div class="gallery-card gallery-card--${SIZE_CYCLE[i % SIZE_CYCLE.length]} gallery-skeleton" aria-hidden="true"></div>`
  ).join('');
}

function buildErrorState(msg = 'Unable to load gallery photos. Please try refreshing the page.') {
  return `<div class="gallery-empty visible" role="alert">
    <i class="fa-solid fa-image-slash"></i>
    <h4>Gallery Unavailable</h4>
    <p>${escapeHtml(msg)}</p>
  </div>`;
}
