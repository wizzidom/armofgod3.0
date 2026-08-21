/* ============================================================
   HOME PAGE — JavaScript
   Testimonials Swiper, Gallery Lightbox init
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Testimonials Swiper ───────────────────────────────── */
  if (typeof Swiper !== 'undefined') {
    new Swiper('.testimonials-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      grabCursor: true,
      autoplay: {
        delay: 5500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        640: {
          slidesPerView: 1.5,
        },
        900: {
          slidesPerView: 2,
        },
        1200: {
          slidesPerView: 3,
        },
      },
      a11y: {
        prevSlideMessage: 'Previous testimonial',
        nextSlideMessage: 'Next testimonial',
      },
    });
  }

  /* ─── GLightbox for gallery preview ────────────────────── */
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.gallery-item a, .gallery-item[data-href]',
      touchNavigation: true,
      loop: true,
      closeEffect: 'fade',
      openEffect: 'zoom',
      skin: 'clean',
    });
  }

  /* ─── Hero stat numbers — quick count-up ───────────────── */
  const heroNums = document.querySelectorAll('.hero-stat-number');
  heroNums.forEach(el => {
    const text = el.textContent.trim();
    el.dataset.original = text;
  });

  /* ─── Value cards tilt effect ───────────────────────────── */
  const valueCards = document.querySelectorAll('.value-card');
  valueCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect  = card.getBoundingClientRect();
      const x     = (e.clientX - rect.left) / rect.width  - 0.5;
      const y     = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-5px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ─── Charity cards hover pulse ────────────────────────── */
  const charityCards = document.querySelectorAll('.charity-card');
  charityCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(card.querySelector('.charity-card-icon'), {
          scale: 1.1,
          rotate: -5,
          duration: 0.3,
          ease: 'back.out(1.7)',
        });
      }
    });
    card.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(card.querySelector('.charity-card-icon'), {
          scale: 1,
          rotate: 0,
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    });
  });

  /* ─── Scripture section text reveal ────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const verse = document.querySelector('.scripture-verse');
    if (verse) {
      gsap.fromTo(verse,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: verse,
            start: 'top 80%',
          },
        }
      );
    }

    /* CTA section entrance */
    const ctaContent = document.querySelector('.cta-content');
    if (ctaContent) {
      gsap.fromTo(ctaContent,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ctaContent,
            start: 'top 80%',
          },
        }
      );
    }
  }

  /* ─── Gallery preview hover ─────────────────────────────── */
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      // Placeholder — GLightbox handles actual lightbox
    });
  });

});
