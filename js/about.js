/* ============================================================
   ABOUT PAGE — JavaScript
   FAQ accordion, Timeline animations
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── FAQ Accordion ─────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    const icon     = item.querySelector('.faq-icon i');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      /* Close all other items */
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          const otherQ = other.querySelector('.faq-question');
          if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
        }
      });

      /* Toggle this item */
      item.classList.toggle('is-open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));

      /* GSAP micro-animation on icon if available */
      if (typeof gsap !== 'undefined' && icon) {
        gsap.to(icon, {
          rotation: isOpen ? 0 : 45,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true,
        });
      }
    });

    /* Keyboard: Space / Enter */
    question.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        question.click();
      }
    });
  });

  /* ─── Timeline scroll reveal ────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, i) => {
      const card = item.querySelector('.timeline-card');
      const dot  = item.querySelector('.timeline-dot');
      const isEven = i % 2 !== 0;

      if (card) {
        gsap.fromTo(card,
          { opacity: 0, x: isEven ? 40 : -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
            },
          }
        );
      }

      if (dot) {
        gsap.fromTo(dot,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.5,
            ease: 'back.out(2)',
            delay: 0.2,
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
            },
          }
        );
      }
    });

    /* Mission/Vision cards entrance */
    const mvCards = document.querySelectorAll('.mv-card');
    mvCards.forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
          },
        }
      );
    });

    /* Core value items stagger */
    const coreValues = document.querySelectorAll('.core-value-item');
    if (coreValues.length) {
      gsap.fromTo(coreValues,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.core-values-list',
            start: 'top 75%',
          },
        }
      );
    }
  }

  /* ─── Team card hover lift ───────────────────────────────── */
  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(card, {
        y: -8,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    });
    card.addEventListener('mouseleave', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(card, {
        y: 0,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
        overwrite: true,
      });
    });
  });

  /* ─── Pastor social links hover ─────────────────────────── */
  document.querySelectorAll('.pastor-social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(link, { y: -3, duration: 0.2, ease: 'power2.out' });
    });
    link.addEventListener('mouseleave', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(link, { y: 0, duration: 0.3, ease: 'elastic.out(1,0.5)' });
    });
  });

});
