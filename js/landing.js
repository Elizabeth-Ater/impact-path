/* ============================================================
   GCGO ADVISOR — LANDING PAGE LOGIC
   Wires the "student details" form to the shared validation
   engine and hands off to the quiz page on success.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const { PATTERNS, bindFieldValidation, validateField } = window.GCGOValidation;

  const form = document.getElementById('student-details-form');
  const nameInput = document.getElementById('student-name');
  const emailInput = document.getElementById('student-email');
  const idInput = document.getElementById('student-id');
  const phoneInput = document.getElementById('student-phone');
  const statusEl = form.querySelector('.form-submit-status');

  // Real-time validation as the student types or leaves each field
  bindFieldValidation(nameInput, PATTERNS.name, 'Letters only — no numbers or symbols, e.g. Aïsha Ramgoolam.');
  bindFieldValidation(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@student.bse.ac.mu.');
  bindFieldValidation(idInput, PATTERNS.studentId, 'Format: BSE followed by 6 digits, e.g. BSE102345.');
  bindFieldValidation(phoneInput, PATTERNS.phone, 'Enter 7–15 digits, optionally starting with +.');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const validName = validateField(nameInput, PATTERNS.name, 'Letters only — no numbers or symbols, e.g. Aïsha Ramgoolam.');
    const validEmail = validateField(emailInput, PATTERNS.institutionalEmail, 'Use your institutional email, e.g. name@student.bse.ac.mu.');
    const validId = validateField(idInput, PATTERNS.studentId, 'Format: BSE followed by 6 digits, e.g. BSE102345.');
    const validPhone = validateField(phoneInput, PATTERNS.phone, 'Enter 7–15 digits, optionally starting with +.');

    if (validName && validEmail && validId && validPhone) {
      // Persist the student's name for personalized copy on later
      // pages (quiz + results) via localStorage — no backend exists.
      localStorage.setItem('gcgo_student_name', nameInput.value.trim());

      statusEl.textContent = `Thanks, ${nameInput.value.trim()}! Redirecting to the quiz…`;
      statusEl.className = 'form-submit-status is-success';

      setTimeout(() => {
        window.location.href = 'pages/quiz.html';
      }, 900);
    } else {
      statusEl.textContent = 'Please fix the highlighted fields before continuing.';
      statusEl.className = 'form-submit-status is-error';
    }
  });
});

