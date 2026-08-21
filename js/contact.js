/* ============================================================
   CONTACT PAGE — JavaScript
   Form validation, Subject tabs, Success state
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Subject Tabs ──────────────────────────────────────── */
  const subjectTabs   = document.querySelectorAll('.subject-tab');
  const subjectInput  = document.getElementById('formSubject');
  const messageField  = document.getElementById('message');

  const subjectPlaceholders = {
    general:   'Tell us how we can help you…',
    visit:     'Let us know when you\'d like to visit and any questions you have…',
    prayer:    'Share your prayer request with us — all requests are treated with confidentiality…',
    volunteer: 'Tell us a bit about yourself and which area you\'d like to serve in…',
    media:     'Describe your media or press enquiry…',
  };

  subjectTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      subjectTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const subject = tab.dataset.subject || 'general';
      if (subjectInput) {
        subjectInput.value = tab.textContent.trim().replace(/^[^\w]*/, '');
      }
      if (messageField && subjectPlaceholders[subject]) {
        messageField.placeholder = subjectPlaceholders[subject];
      }
    });
  });

  /* ─── Form Validation ───────────────────────────────────── */
  const form       = document.getElementById('contactForm');
  const successEl  = document.getElementById('formSuccess');
  const submitBtn  = document.getElementById('formSubmitBtn');
  const submitText = document.getElementById('submitBtnText');

  if (!form) return;

  /* Validation rules */
  const rules = {
    firstName: {
      validate: (v) => v.trim().length >= 2,
      errorId:  'firstNameError',
      message:  'Please enter your first name.',
    },
    lastName: {
      validate: (v) => v.trim().length >= 2,
      errorId:  'lastNameError',
      message:  'Please enter your last name.',
    },
    email: {
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      errorId:  'emailError',
      message:  'Please enter a valid email address.',
    },
    message: {
      validate: (v) => v.trim().length >= 10,
      errorId:  'messageError',
      message:  'Please enter a message (at least 10 characters).',
    },
  };

  function showError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.add('error');
    if (error)  error.classList.add('visible');
  }

  function clearError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field)  field.classList.remove('error');
    if (error)  error.classList.remove('visible');
  }

  function markSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.remove('error');
      field.classList.add('success');
    }
  }

  /* Real-time validation on blur */
  Object.entries(rules).forEach(([id, rule]) => {
    const field = document.getElementById(id);
    if (!field) return;

    field.addEventListener('blur', () => {
      if (rule.validate(field.value)) {
        clearError(id, rule.errorId);
        markSuccess(id);
      } else {
        showError(id, rule.errorId);
        field.classList.remove('success');
      }
    });

    field.addEventListener('input', () => {
      if (field.classList.contains('error') && rule.validate(field.value)) {
        clearError(id, rule.errorId);
        markSuccess(id);
      }
    });
  });

  /* Privacy checkbox validation */
  const privacyBox   = document.getElementById('privacy');
  const privacyError = document.getElementById('privacyError');

  /* Form submission */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    /* Validate each rule */
    Object.entries(rules).forEach(([id, rule]) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (rule.validate(field.value)) {
        clearError(id, rule.errorId);
        markSuccess(id);
      } else {
        showError(id, rule.errorId);
        valid = false;
      }
    });

    /* Privacy checkbox */
    if (privacyBox && !privacyBox.checked) {
      if (privacyError) privacyError.classList.add('visible');
      valid = false;
    } else if (privacyError) {
      privacyError.classList.remove('visible');
    }

    if (!valid) {
      /* Shake the form */
      if (typeof gsap !== 'undefined') {
        gsap.to(form, {
          x: [-8, 8, -6, 6, -3, 3, 0],
          duration: 0.5,
          ease: 'power2.inOut',
        });
      }
      /* Focus first error */
      const firstError = form.querySelector('.form-input.error, .form-textarea.error');
      if (firstError) firstError.focus();
      return;
    }

    /* Loading state */
    if (submitBtn) submitBtn.classList.add('loading');
    if (submitText) submitText.textContent = 'Sending…';
    if (submitBtn) {
      submitBtn.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
    }

    /* Simulate send */
    setTimeout(() => {
      form.style.display = 'none';
      if (successEl) {
        successEl.classList.add('visible');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(successEl,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
          );
        }
      }
    }, 1800);
  });

  /* ─── Reset form ────────────────────────────────────────── */
  window.resetContactForm = () => {
    form.reset();
    form.style.display = '';
    if (successEl) successEl.classList.remove('visible');
    if (submitBtn) submitBtn.classList.remove('loading');
    if (submitText) submitText.textContent = 'Send Message';
    if (submitBtn) {
      const icon = submitBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-paper-plane';
    }
    /* Remove validation states */
    form.querySelectorAll('.form-input, .form-textarea').forEach(f => {
      f.classList.remove('error', 'success');
    });
    form.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
  };

  /* ─── Character count for message ──────────────────────── */
  if (messageField) {
    const counter = document.createElement('span');
    counter.style.cssText = `
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-align: right;
      display: block;
      margin-top: 0.25rem;
    `;
    counter.textContent = '0 / 1000 characters';
    messageField.parentNode.insertBefore(counter, messageField.nextSibling);

    messageField.addEventListener('input', () => {
      const len = messageField.value.length;
      counter.textContent = `${len} / 1000 characters`;
      counter.style.color = len > 900 ? 'var(--fire-red)' : 'var(--text-muted)';
      if (len > 1000) messageField.value = messageField.value.slice(0, 1000);
    });
  }

  /* ─── Contact detail hover ──────────────────────────────── */
  document.querySelectorAll('.contact-detail').forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(item.querySelector('.contact-detail-icon'), {
        scale: 1.08,
        duration: 0.25,
        ease: 'back.out(2)',
      });
    });
    item.addEventListener('mouseleave', () => {
      if (typeof gsap === 'undefined') return;
      gsap.to(item.querySelector('.contact-detail-icon'), {
        scale: 1,
        duration: 0.3,
        ease: 'elastic.out(1,0.5)',
      });
    });
  });

  /* ─── GSAP form entrance ────────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const formWrap = document.querySelector('.contact-form-wrap');
    if (formWrap) {
      gsap.fromTo(formWrap,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: formWrap, start: 'top 80%' },
        }
      );
    }

    const infoCards = document.querySelectorAll('.info-card');
    if (infoCards.length) {
      gsap.fromTo(infoCards,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.contact-sidebar',
            start: 'top 80%',
          },
        }
      );
    }
  }

});
