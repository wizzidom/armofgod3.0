/* ============================================================
   GALLERY PAGE — JavaScript
   Loads images dynamically from /_data/gallery.json
   Supports: GLightbox, filter tabs, view toggle, GSAP, parallax
   ============================================================ */

'use strict';

/* ─── Size variants cycled for visual variety ───────────────
   Rotates through the same classes the original hardcoded
   cards used so the masonry layout looks identical.          */
const SIZE_CYCLE = ['tall', 'square', 'wide', 'short', 'tall', 'square', 'short', 'wide'];

/* ─── Category label map (value → display label) ─────────── */
const CATEGORY_LABELS = {
  worship:     'Worship',
  sunday:      'Sunday Services',
  community:   'Community',
  youth:       'Youth',
  outreach:    'Outreach',
  conferences: 'Conferences',
};

/* ─── GitHub repo details (used to list photos via API) ─────
   The Contents API lets us fetch the list of files in a folder
   without needing a server-side directory listing.            */
const GITHUB_REPO    = 'wizzidom/armofgod3.0';
const PHOTOS_DIR     = '_data/photos';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${PHOTOS_DIR}`;

/* ============================================================
   MAIN ENTRY POINT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender();
});

/* ============================================================
   STEP 1 — Fetch all photos then render everything
   Photos come from two sources merged together:
   1. _data/gallery.json  — original/migrated photos
   2. _data/photos/*.json — photos added via Decap CMS admin
   ============================================================ */
async function loadAndRender() {
  const grid    = document.getElementById('galleryGrid');
  const countEl = document.getElementById('galleryCountNum');

  if (!grid) return;

  grid.innerHTML = buildLoadingSkeleton();

  let photos = [];

  try {
    // Load original gallery.json (migrated photos)
    const baseRes = await fetch('../_data/gallery.json');
    if (baseRes.ok) {
      const basePhotos = await baseRes.json();
      if (Array.isArray(basePhotos)) photos = photos.concat(basePhotos);
    }
  } catch (err) {
    console.warn('[Gallery] Could not load gallery.json:', err);
  }

  try {
    // Load CMS-added photos from GitHub Contents API
    const apiRes = await fetch(GITHUB_API_URL, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (apiRes.ok) {
      const files = await apiRes.json();

      if (Array.isArray(files)) {
        // Fetch each individual JSON file in parallel
        const fetches = files
          .filter(f => f.name.endsWith('.json'))
          .map(f => fetch(f.download_url).then(r => r.json()).catch(() => null));

        const results = await Promise.all(fetches);
        results.forEach(photo => {
          if (photo && photo.src) photos.push(photo);
        });
      }
    }
  } catch (err) {
    console.warn('[Gallery] Could not load CMS photos:', err);
  }

  if (photos.length === 0) {
    grid.innerHTML = buildErrorState('No photos found in the gallery yet.');
    return;
  }

  grid.innerHTML = photos.map((photo, index) => buildCard(photo, index)).join('');

  if (countEl) countEl.textContent = photos.length;

  initInteractivity(grid, photos.length);
}

/* ============================================================
   STEP 2 — Build a single gallery card
   ============================================================ */
function buildCard(photo, index) {
  const sizeClass = SIZE_CYCLE[index % SIZE_CYCLE.length];
  const catLabel  = CATEGORY_LABELS[photo.category] || photo.category || 'General';

  /* Uploaded images from Decap CMS land in /assets/gallery/
     and are stored as absolute paths like /assets/gallery/img.jpg.
     Original images that were already on the site are just filenames
     like "10.jpeg" — resolve those relative to the repo root.       */
  const src = resolveSrc(photo.src);

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
   STEP 3 — Boot all interactive features
   ============================================================ */
function initInteractivity(grid, totalCount) {
  const filterTabs  = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('gallerySearch');
  const countEl     = document.getElementById('galleryCountNum');
  const emptyState  = document.getElementById('galleryEmpty');
  const viewBtns    = document.querySelectorAll('.view-btn');
  const filterBar   = document.getElementById('galleryFilterBar');

  let currentFilter = 'all';
  let searchQuery   = '';
  let lightbox      = null;

  const allCards = Array.from(grid.querySelectorAll('.gallery-card'));

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

  /* ─── Filter / Search logic ─────────────────────────────── */
  function applyFilter() {
    let visible = 0;

    allCards.forEach(card => {
      const cat      = (card.dataset.category || '').toLowerCase();
      const titleEl  = card.querySelector('.gallery-card-title');
      const catEl    = card.querySelector('.gallery-card-cat');
      const combined = [
        cat,
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

    // Rebuild lightbox so only visible items are included
    initLightbox();
  }

  /* ─── Filter tabs ───────────────────────────────────────── */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
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
        const cols = btn.dataset.cols;
        grid.className = 'gallery-grid';
        if (cols === '3') grid.classList.add('view-3');
        if (cols === '2') grid.classList.add('view-2');
      });
    });
  }

  /* ─── Sticky filter bar ─────────────────────────────────── */
  if (filterBar) {
    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80'
    );
    const observer = new IntersectionObserver(
      ([entry]) => filterBar.classList.toggle('is-stuck', !entry.isIntersecting),
      { threshold: 1, rootMargin: `-${navHeight}px 0px 0px 0px` }
    );
    observer.observe(filterBar);
  }

  /* ─── Card hover parallax ───────────────────────────────── */
  allCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      const img  = card.querySelector('img');
      if (img) img.style.transform = `scale(1.08) translate(${x * 8}px, ${y * 8}px)`;
    });
    card.addEventListener('mouseleave', () => {
      const img = card.querySelector('img');
      if (img) img.style.transform = '';
    });
  });

  /* ─── GSAP entrance animation ───────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.fromTo(allCards,
      { opacity: 0, y: 24 },
      {
        opacity:  1,
        y:        0,
        duration: 0.5,
        stagger:  { amount: 0.8, from: 'start' },
        ease:     'power2.out',
        scrollTrigger: {
          trigger: grid,
          start:   'top 85%',
          once:    true,
        },
      }
    );
  }

  /* Run initial filter pass (shows all cards) */
  applyFilter();
}

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Resolve image src to the correct path.
 * - Absolute paths (/assets/gallery/...) are used as-is.
 * - Relative filenames (10.jpeg) are prefixed with ../ because
 *   gallery.html lives in /pages/ and the images are at root.
 */
function resolveSrc(src) {
  if (!src) return '';
  if (src.startsWith('/') || src.startsWith('http')) return src;
  // Strip any leading ../ the CMS may have stored, then re-add one
  const clean = src.replace(/^(\.\.\/)+/, '');
  return `../${clean}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function buildLoadingSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => {
    const size = SIZE_CYCLE[i % SIZE_CYCLE.length];
    return `<div class="gallery-card gallery-card--${size} gallery-skeleton" aria-hidden="true"></div>`;
  }).join('');
}

function buildErrorState(msg = 'Unable to load gallery photos. Please try refreshing the page.') {
  return `
    <div class="gallery-empty visible" role="alert">
      <i class="fa-solid fa-image-slash"></i>
      <h4>Gallery Unavailable</h4>
      <p>${escapeHtml(msg)}</p>
    </div>
  `;
}
