/* ============================================================
   GALLERY PAGE — JavaScript
   Filter, Search, View toggle, GLightbox, Load More
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const grid        = document.getElementById('galleryGrid');
  const filterTabs  = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('gallerySearch');
  const countEl     = document.getElementById('galleryCountNum');
  const emptyState  = document.getElementById('galleryEmpty');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const viewBtns    = document.querySelectorAll('.view-btn');
  const filterBar   = document.getElementById('galleryFilterBar');

  let currentFilter = 'all';
  let searchQuery   = '';

  /* ─── GLightbox ─────────────────────────────────────────── */
  let lightbox;
  if (typeof GLightbox !== 'undefined') {
    lightbox = GLightbox({
      selector: '.gallery-card.glightbox:not(.hidden)',
      touchNavigation: true,
      loop: true,
      closeEffect: 'fade',
      openEffect: 'zoom',
      skin: 'clean',
      descPosition: 'bottom',
    });
  }

  /* ─── Filter Logic ──────────────────────────────────────── */
  function applyFilter() {
    const cards   = grid ? grid.querySelectorAll('.gallery-card') : [];
    let   visible = 0;

    cards.forEach(card => {
      const cat   = (card.dataset.category || '').toLowerCase();
      const title = (card.querySelector('.gallery-card-title')?.textContent || '').toLowerCase();
      const catEl = (card.querySelector('.gallery-card-cat')?.textContent || '').toLowerCase();
      const combined = title + ' ' + catEl + ' ' + cat;

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

    /* Update count */
    if (countEl) countEl.textContent = visible;

    /* Empty state */
    if (emptyState) {
      emptyState.classList.toggle('visible', visible === 0);
    }

    /* Refresh lightbox to only include visible items */
    if (lightbox && typeof GLightbox !== 'undefined') {
      lightbox.destroy();
      lightbox = GLightbox({
        selector: '.gallery-card.glightbox:not(.hidden)',
        touchNavigation: true,
        loop: true,
        closeEffect: 'fade',
        openEffect: 'zoom',
        skin: 'clean',
        descPosition: 'bottom',
      });
    }
  }

  /* ─── Filter Tabs ───────────────────────────────────────── */
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
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.toLowerCase().trim();
        applyFilter();
      }, 250);
    });
  }

  /* ─── View Toggle ───────────────────────────────────────── */
  if (grid && viewBtns.length) {
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

  /* ─── Sticky Filter Bar ─────────────────────────────────── */
  if (filterBar) {
    const observer = new IntersectionObserver(
      ([entry]) => filterBar.classList.toggle('is-stuck', !entry.isIntersecting),
      { threshold: 1, rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || 80)}px 0px 0px 0px` }
    );
    observer.observe(filterBar);
  }

  /* ─── Load More (simulated) ─────────────────────────────── */
  /* All 24 cards are already in the DOM; this hides the first
     12 extra and reveals them on click for a realistic UX demo */
  const allCards = grid ? Array.from(grid.querySelectorAll('.gallery-card')) : [];
  const PAGE_SIZE = 12;
  let shown = PAGE_SIZE;

  function updateLoadMore() {
    allCards.forEach((card, i) => {
      if (i >= shown) {
        card.dataset.paginated = 'hidden';
        card.classList.add('hidden');
      } else {
        delete card.dataset.paginated;
      }
    });
    applyFilter();
    if (loadMoreBtn) {
      loadMoreBtn.style.display = shown >= allCards.length ? 'none' : '';
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      shown = Math.min(shown + PAGE_SIZE, allCards.length);
      allCards.slice(shown - PAGE_SIZE, shown).forEach(card => {
        card.classList.remove('hidden');
        delete card.dataset.paginated;
        card.classList.add('fade-in');
        setTimeout(() => card.classList.remove('fade-in'), 500);
      });
      if (shown >= allCards.length) loadMoreBtn.style.display = 'none';
      if (countEl) countEl.textContent = grid.querySelectorAll('.gallery-card:not(.hidden)').length;
    });
  }

  /* Initialise with all cards visible (no pagination on this demo) */
  applyFilter();

  /* ─── Card hover parallax ───────────────────────────────── */
  allCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      const img  = card.querySelector('img');
      if (img) {
        img.style.transform = `scale(1.08) translate(${x * 8}px, ${y * 8}px)`;
      }
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
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: { amount: 0.8, from: 'start' },
        ease: 'power2.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      }
    );
  }

});
