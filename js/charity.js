/* ============================================================
   CHARITY PAGE — JavaScript
   Animated counters, donation picker, GLightbox video
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── GLightbox for video button ───────────────────────── */
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.overview-video-btn',
      touchNavigation: true,
      loop: false,
      closeEffect: 'fade',
      openEffect: 'zoom',
    });
  }

  /* ─── Donation Amount Picker ────────────────────────────── */
  const amountBtns   = document.querySelectorAll('.donation-amount');
  const customWrap   = document.getElementById('customAmountWrap');
  const customInput  = document.getElementById('customAmount');

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset && btn.onclick) {
        // handled via inline onclick
      }
    });
  });

  /* Expose to inline onclick */
  window.selectAmount = (btn, value) => {
    amountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (value === 'custom') {
      if (customWrap) {
        customWrap.style.display = 'flex';
        if (customInput) customInput.focus();
      }
    } else {
      if (customWrap) customWrap.style.display = 'none';
    }
  };

  /* ─── Stats Band counter animation ─────────────────────── */
  /* Handled by main.js IntersectionObserver for .counter[data-target] */

  /* ─── Programs card hover tilt ──────────────────────────── */
  document.querySelectorAll('.program-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
    });
  });

  /* ─── Volunteer role cards – icon bounce ────────────────── */
  document.querySelectorAll('.volunteer-role').forEach(role => {
    const icon = role.querySelector('.volunteer-role-icon');
    if (!icon) return;

    role.addEventListener('mouseenter', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(icon, {
        scale: 1.15,
        rotate: -8,
        duration: 0.3,
        ease: 'back.out(2)',
      });
    });
    role.addEventListener('mouseleave', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(icon, {
        scale: 1,
        rotate: 0,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });

  /* ─── Outreach section parallax images ─────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('.outreach-img').forEach(img => {
      gsap.to(img, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.outreach-item'),
          scrub: 1.5,
          start: 'top bottom',
          end: 'bottom top',
        },
      });
    });

    /* Donation section split entrance */
    const donationInner = document.querySelector('.donation-inner');
    if (donationInner) {
      const [left, right] = donationInner.children;
      if (left) {
        gsap.fromTo(left,
          { opacity: 0, x: -30 },
          {
            opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: donationInner, start: 'top 75%' },
          }
        );
      }
      if (right) {
        gsap.fromTo(right,
          { opacity: 0, x: 30 },
          {
            opacity: 1, x: 0, duration: 0.9, delay: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: donationInner, start: 'top 75%' },
          }
        );
      }
    }
  }

  /* ─── Stats Band number entrance ───────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const statItems = document.querySelectorAll('.stat-item');
    if (statItems.length) {
      gsap.fromTo(statItems,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.stats-band',
            start: 'top 85%',
          },
        }
      );
    }
  }

});
