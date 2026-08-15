/* ============================================================
   GCGO ADVISOR — CONTACT PAGE LOGIC
   Wires the contact form to the shared validation engine.
   No backend exists for this coursework project, so a valid
   submission just confirms success and resets the form.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const { PATTERNS, bindFieldValidation, validateField } = window.GCGOValidation;

  const form = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const subjectInput = document.getElementById('contact-subject');
  const messageInput = document.getElementById('contact-message');
  const statusEl = form.querySelector('.form-submit-status');

  bindFieldValidation(nameInput, PATTERNS.name, 'Letters only — no numbers or symbols.');
  bindFieldValidation(emailInput, PATTERNS.generalEmail, 'Enter a valid email address, e.g. you@example.com.');
  bindFieldValidation(subjectInput, PATTERNS.contactSubject, 'Subject should be 3–100 characters.');
  bindFieldValidation(messageInput, PATTERNS.contactMessage, 'Message should be at least 10 characters.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const validName = validateField(nameInput, PATTERNS.name, 'Letters only — no numbers or symbols.');
    const validEmail = validateField(emailInput, PATTERNS.generalEmail, 'Enter a valid email address, e.g. you@example.com.');
    const validSubject = validateField(subjectInput, PATTERNS.contactSubject, 'Subject should be 3–100 characters.');
    const validMessage = validateField(messageInput, PATTERNS.contactMessage, 'Message should be at least 10 characters.');

    if (validName && validEmail && validSubject && validMessage) {
      statusEl.textContent = `Thanks, ${nameInput.value.trim()} — your message has been sent.`;
      statusEl.className = 'form-submit-status is-success';
      form.reset();
      form.querySelectorAll('.field__input').forEach((el) => el.classList.remove('is-valid', 'is-invalid'));
    } else {
      statusEl.textContent = 'Please fix the highlighted fields before sending.';
      statusEl.className = 'form-submit-status is-error';
    }
  });
});

