/* ============================================================
   ARM OF GOD MINISTRIES — MAIN JAVASCRIPT
   Shared across all pages: Nav, AOS, Particles, Newsletter,
   Scroll behaviours, GSAP base setup
   ============================================================ */

'use strict';

/* ─── AOS Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({
    duration: 800,
    once: true,
    offset: 80,
    easing: 'ease-out-cubic',
  });
});

/* ─── Navigation ──────────────────────────────────────────── */
(function initNav() {
  const navbar   = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const drawer   = document.getElementById('navDrawer');
  if (!navbar) return;

  /* Transparent → scrolled transition */
  const isTransparent = navbar.classList.contains('nav-transparent');

  function onScroll() {
    if (!isTransparent) return;
    if (window.scrollY > 60) {
      navbar.classList.remove('nav-transparent');
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.add('nav-transparent');
      navbar.classList.remove('nav-scrolled');
    }
  }

  if (isTransparent) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile drawer toggle */
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Close drawer on link click */
    drawer.querySelectorAll('.nav-drawer-link').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('is-open') &&
          !drawer.contains(e.target) &&
          !toggle.contains(e.target)) {
        drawer.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
})();

/* ─── Smooth Scroll for Anchor Links ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80'
    );
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─── Hero Scroll Indicator ──────────────────────────────── */
(function initHeroScroll() {
  const heroScroll = document.getElementById('heroScroll');
  if (!heroScroll) return;
  heroScroll.addEventListener('click', () => {
    const firstSection = document.querySelector('#about-preview, .about-preview, .page-hero + *');
    if (firstSection) {
      firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

/* ─── Hero Particles ──────────────────────────────────────── */
(function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const count = window.innerWidth < 640 ? 12 : 22;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = Math.random() * 10 + 8;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    container.appendChild(p);
  }
})();

/* ─── Hero Image Ken Burns ────────────────────────────────── */
(function initHeroKenBurns() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  setTimeout(() => hero.classList.add('loaded'), 100);
})();

/* ─── Page Hero Img Load ──────────────────────────────────── */
(function initPageHeroLoad() {
  const sections = document.querySelectorAll(
    '.page-hero, .gallery-hero, .charity-hero, .contact-hero'
  );
  sections.forEach(s => {
    const img = s.querySelector('img');
    if (!img) return;
    if (img.complete) {
      s.classList.add('loaded');
    } else {
      img.addEventListener('load', () => s.classList.add('loaded'));
    }
  });
})();

/* ─── Animated Counters ───────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.counter[data-target]');
  if (!counters.length) return;

  const formatNum = (n) => n >= 1000 ? (n / 1000).toFixed(0) + 'K+' : n + (n >= 100 ? '+' : '');

  const animateCounter = (el) => {
    const target  = parseInt(el.dataset.target, 10);
    const suffix  = el.dataset.suffix || '';
    const duration = 2000;
    const start   = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease     = 1 - Math.pow(1 - progress, 3);
      const current  = Math.floor(ease * target);
      el.textContent = (target >= 1000 ? formatNum(current) : current) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = (target >= 1000 ? formatNum(target) : target) + suffix;
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
})();

/* ─── Newsletter Form ─────────────────────────────────────── */
function handleNewsletter(e) {
  e.preventDefault();
  const form  = e.target;
  const input = form.querySelector('.newsletter-input');
  const btn   = form.querySelector('.newsletter-btn');
  if (!input || !input.value) return;

  const original = btn.innerHTML;
  btn.innerHTML  = '<i class="fa-solid fa-spinner fa-spin"></i> Subscribing…';
  btn.disabled   = true;

  setTimeout(() => {
    btn.innerHTML  = '<i class="fa-solid fa-circle-check"></i> Subscribed!';
    btn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
    input.value    = '';
    setTimeout(() => {
      btn.innerHTML  = original;
      btn.style.background = '';
      btn.disabled   = false;
    }, 3000);
  }, 1200);
}

/* ─── GSAP ScrollTrigger Parallax (if GSAP loaded) ─────────── */
(function initParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* Scripture section parallax */
  const scripture = document.querySelector('.scripture-section');
  if (scripture) {
    const bg = scripture.querySelector('.scripture-bg img');
    if (bg) {
      gsap.to(bg, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: {
          trigger: scripture,
          scrub: 1.5,
          start: 'top bottom',
          end: 'bottom top',
        },
      });
    }
  }

  /* Hero parallax */
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        scrub: 1,
        start: 'top top',
        end: 'bottom top',
      },
    });
  }

  /* Page hero parallax */
  const pageHeroBg = document.querySelector(
    '.page-hero-bg img, .gallery-hero-bg img, .charity-hero-bg img, .contact-hero-bg img'
  );
  if (pageHeroBg) {
    const section = pageHeroBg.closest(
      '.page-hero, .gallery-hero, .charity-hero, .contact-hero'
    );
    if (section) {
      gsap.to(pageHeroBg, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          scrub: 1.2,
          start: 'top top',
          end: 'bottom top',
        },
      });
    }
  }

  /* Stagger reveal for value/charity cards */
  const cardGroups = document.querySelectorAll(
    '.values-grid, .charity-cards, .programs-grid, .team-grid'
  );
  cardGroups.forEach(group => {
    const cards = group.children;
    gsap.fromTo(cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: group,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
})();

/* ─── Ripple Effect on Buttons ────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-primary, .btn-red');
  if (!btn) return;
  const rect   = btn.getBoundingClientRect();
  const x      = e.clientX - rect.left;
  const y      = e.clientY - rect.top;
  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position:absolute;
    width:4px;height:4px;
    left:${x}px;top:${y}px;
    transform:translate(-50%,-50%) scale(0);
    background:rgba(255,255,255,0.35);
    border-radius:50%;
    pointer-events:none;
    animation:rippleAnim 0.6s ease-out forwards;
  `;
  if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id    = 'rippleStyle';
    style.textContent = `
      @keyframes rippleAnim {
        to { transform: translate(-50%,-50%) scale(80); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});

/* ─── Magnetic Button Effect (CTA buttons) ───────────────── */
(function initMagnetic() {
  const btns = document.querySelectorAll('.btn-xl');
  btns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect   = btn.getBoundingClientRect();
      const x      = (e.clientX - rect.left - rect.width / 2) * 0.15;
      const y      = (e.clientY - rect.top - rect.height / 2) * 0.15;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ─── Active Nav Link ─────────────────────────────────────── */
(function setActiveNav() {
  const path  = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link, .nav-drawer-link');
  links.forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) {
      link.classList.add('active');
    }
  });
})();

/* ─── Lazy Image Observer ─────────────────────────────────── */
(function initLazyImages() {
  if (!('IntersectionObserver' in window)) return;
  const imgs = document.querySelectorAll('img[loading="lazy"]');
  const obs  = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'opacity 0.4s ease';
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(img => obs.observe(img));
})();

/* ─── Scroll Progress Bar ─────────────────────────────────── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--sky-blue), var(--fire-red));
    z-index: 9999;
    width: 0%;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
  }, { passive: true });
})();

/* ─── Back-to-Top Button ──────────────────────────────────── */
(function initBackToTop() {
  const btn = document.createElement('button');
  btn.innerHTML    = '<i class="fa-solid fa-arrow-up"></i>';
  btn.setAttribute('aria-label', 'Back to top');
  btn.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--sky-gradient);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 0 4px 20px rgba(26,111,191,0.35);
    z-index: 500;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    pointer-events: none;
  `;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const visible = window.scrollY > 400;
    btn.style.opacity         = visible ? '1' : '0';
    btn.style.transform       = visible ? 'translateY(0)' : 'translateY(10px)';
    btn.style.pointerEvents   = visible ? 'all' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
