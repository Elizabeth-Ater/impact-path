/* ============================================================
   IMPACTPATH — PAGE CHROME
   Seven small pieces of UI shared identically across every page:
   1. The preloader — hides the full-screen loading overlay once
      the page has finished loading.
   2. The footer year — keeps the copyright year in the footer
      current automatically.
   3. The "My Results" nav link — hidden until the student has
      completed the quiz at least once (checked via localStorage).
   4. The footer newsletter form — validated with the shared regex
      engine; a front-end demonstration only (no backend).
   5. The back-to-top button in the footer's bottom bar.
   6. The mobile nav toggle — opens/closes the hamburger dropdown
      containing the nav links and Log in/Sign up buttons on
      narrow screens (see the "Nav panel" rules in css/style.css).
   7. The Login / Sign up modal — shared across every page's nav
      bar. This is a front-end demonstration only (no backend),
      so a successful validation just confirms the UI flow works.
   Combined into one file since all seven are small and all run
   on every page, unlike the page-specific scripts (landing.js,
   quiz.js, etc.) which only load where they're needed.
   ============================================================ */

// ---- 1. Preloader ----
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Small minimum-display delay so the preloader doesn't just
  // flash on fast connections — long enough to read, short
  // enough not to feel like an obstacle.
  const MIN_DISPLAY_MS = 400;

  setTimeout(() => {
    preloader.classList.add('is-hidden');
    // Remove from the DOM after the fade transition finishes
    preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
  }, MIN_DISPLAY_MS);
});

// ---- 2. Footer year ----
// Keeps the copyright year in the footer current automatically,
// so it never needs a manual edit as years pass.
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('footer-year');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
});

// ---- 3. "My Results" nav link ----
// Hidden by default in the HTML — only revealed once the student
// has actually completed the quiz at least once, so first-time
// visitors never see a link to an empty results page.
document.addEventListener('DOMContentLoaded', () => {
  const resultsLink = document.getElementById('nav-results-link');
  if (!resultsLink) return;
  const hasResults = localStorage.getItem('gcgo_quiz_results');
  if (hasResults) resultsLink.style.display = '';
});

// ---- 4. Footer newsletter form ----
// Front-end demonstration only (no backend) — validates the email
// with the same shared regex engine used everywhere else, then
// just confirms success and resets the field.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newsletter-form');
  if (!form || !window.GCGOValidation) return;

  const { PATTERNS, bindFieldValidation, validateField } = window.GCGOValidation;
  const emailInput = document.getElementById('newsletter-email');
  const statusEl = form.querySelector('.form-submit-status');

  bindFieldValidation(emailInput, PATTERNS.generalEmail, 'Enter a valid email address.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const isValid = validateField(emailInput, PATTERNS.generalEmail, 'Enter a valid email address.');

    if (isValid) {
      statusEl.textContent = 'Subscribed — thanks for following along!';
      statusEl.className = 'form-submit-status is-success';
      form.reset();
      emailInput.classList.remove('is-valid', 'is-invalid');
    } else {
      statusEl.textContent = 'Please enter a valid email.';
      statusEl.className = 'form-submit-status is-error';
    }
  });
});

// ---- 5. Back-to-top button ----
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ---- 6. Mobile nav toggle ----
// Opens/closes the hamburger dropdown on narrow screens. On
// desktop widths the toggle button is hidden by CSS and this
// code simply never fires, so it's harmless there.
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const navPanel = document.getElementById('site-nav-panel');
  if (!navToggle || !navPanel) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navPanel.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the dropdown automatically once a link or button inside
  // it is used, so it doesn't stay open after navigating.
  navPanel.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('click', () => {
      navPanel.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
});

// ---- 7. Auth modal ----
document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('auth-modal-backdrop');
  if (!backdrop) return; // page has no auth modal mounted

  const openBtns = document.querySelectorAll('[data-open-auth]');
  const closeBtn = backdrop.querySelector('.auth-modal__close');
  const tabs = backdrop.querySelectorAll('.auth-modal__tab');
  const panels = backdrop.querySelectorAll('.auth-modal__panel');

  const { PATTERNS, bindFieldValidation, validateField } = window.GCGOValidation;

  // ---- Open / close ----
  function openModal(tabName) {
    backdrop.classList.add('is-open');
    if (tabName) setActiveTab(tabName);
    // Move focus into the modal for keyboard/screen-reader users
    const firstInput = backdrop.querySelector('.auth-modal__panel.is-active input');
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
  }

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.openAuth));
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });

  // ---- Tab switching ----
  function setActiveTab(name) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });

  // ---- Sign up form validation ----
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    const nameInput = signupForm.querySelector('#signup-name');
    const emailInput = signupForm.querySelector('#signup-email');
    const passInput = signupForm.querySelector('#signup-password');

    bindFieldValidation(nameInput, PATTERNS.name, 'Use letters only, e.g. Aïsha Ramgoolam.');
    bindFieldValidation(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@alustudent.com.');
    bindFieldValidation(passInput, PATTERNS.password, 'At least 8 characters, with a letter and a number.');

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const validName = validateField(nameInput, PATTERNS.name, 'Use letters only, e.g. Aïsha Ramgoolam.');
      const validEmail = validateField(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@alustudent.com.');
      const validPass = validateField(passInput, PATTERNS.password, 'At least 8 characters, with a letter and a number.');

      const statusEl = signupForm.querySelector('.form-submit-status');
      if (validName && validEmail && validPass) {
        // Save the name for personalized copy elsewhere on the site.
        localStorage.setItem('gcgo_account_name', nameInput.value.trim());

        statusEl.textContent = `Welcome, ${nameInput.value.trim()} — your account is ready.`;
        statusEl.className = 'form-submit-status is-success';
        setTimeout(closeModal, 1400);
      } else {
        statusEl.textContent = 'Please fix the highlighted fields before continuing.';
        statusEl.className = 'form-submit-status is-error';
      }
    });
  }

  // ---- Login form validation ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const emailInput = loginForm.querySelector('#login-email');
    const passInput = loginForm.querySelector('#login-password');

    bindFieldValidation(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@alustudent.com.');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const validEmail = validateField(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@alustudent.com.');
      const statusEl = loginForm.querySelector('.form-submit-status');

      if (validEmail && passInput.value.trim().length > 0) {
        statusEl.textContent = 'Signed in — redirecting to your journey plan.';
        statusEl.className = 'form-submit-status is-success';
        setTimeout(closeModal, 1200);
      } else {
        statusEl.textContent = 'Enter a valid institutional email and password.';
        statusEl.className = 'form-submit-status is-error';
      }
    });
  }
});

