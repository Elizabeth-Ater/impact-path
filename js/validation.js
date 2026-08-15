/* ============================================================
   GCGO ADVISOR — VALIDATION ENGINE
   Shared inline-validation logic (regex patterns + DOM state
   toggling). Used by landing.js, auth.js, and contact.js so
   every form on the site behaves identically.
   ============================================================ */

// ---- Regex pattern library --------------------------------------------
// Each pattern is documented with what it enforces and why.
const PATTERNS = {
  // Full name: letters (incl. accented), spaces, hyphens and apostrophes
  // only — blocks digits and most special characters as required by
  // the brief's "excluding special characters/numbers" rule.
  name: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/,

  // Institutional email: standard email shape, but requires the
  // student.id@alustudent.com style domain used by the university.
  institutionalEmail: /^[a-zA-Z0-9._%+-]+@alustudent\.com$/,

  // General email fallback (used on the Contact page, where the
  // visitor may not be a BSE student).
  generalEmail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Student ID: institution prefix "BSE" + 6 digits, e.g. BSE102345.
  studentId: /^BSE\d{6}$/i,

  // Phone number: optional +country code, then 7-15 digits, allowing
  // spaces/hyphens for readability (e.g. +230 5712 3456).
  phone: /^\+?[\d\s-]{7,15}$/,

  // Password for the sign-up tab: min 8 chars, at least one letter
  // and one number — kept simple since auth is a UI demonstration,
  // not a real backend.
  password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,

  // Contact page: subject line, 3-100 chars of anything.
  contactSubject: /^.{3,100}$/,

  // Contact page: message body, 10-1000 chars, newlines allowed.
  contactMessage: /^[\s\S]{10,1000}$/,
};

// ---- Field-level validate + paint helper --------------------------------
/**
 * Validates a single input against a regex, toggles .is-valid /
 * .is-invalid, and renders the message in the paired .error-message
 * element. Call this on 'input' and 'blur' per the brief.
 *
 * @param {HTMLInputElement} input
 * @param {RegExp} pattern
 * @param {string} errorText - shown when invalid
 * @returns {boolean} whether the field is currently valid
 */
function validateField(input, pattern, errorText) {
  const wrapper = input.closest('.field');
  const errorEl = wrapper ? wrapper.querySelector('.error-message') : null;
  const value = input.value.trim();
  const isEmpty = value.length === 0;
  const isValid = !isEmpty && pattern.test(value);

  input.classList.remove('just-invalid');

  if (isEmpty) {
    // Neutral state: don't shout "invalid" before the user has typed.
    input.classList.remove('is-valid', 'is-invalid');
    if (errorEl) errorEl.classList.remove('is-visible');
    return false;
  }

  if (isValid) {
    input.classList.add('is-valid');
    input.classList.remove('is-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  } else {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    // Trigger the shake animation on re-entry
    void input.offsetWidth; // force reflow so the animation can restart
    input.classList.add('just-invalid');
    if (errorEl) {
      errorEl.textContent = errorText;
      errorEl.classList.add('is-visible');
    }
  }

  return isValid;
}

/**
 * Wires real-time validation to a field: fires on both 'input' and
 * 'blur' as required by the brief.
 */
function bindFieldValidation(input, pattern, errorText) {
  const handler = () => validateField(input, pattern, errorText);
  input.addEventListener('input', handler);
  input.addEventListener('blur', handler);
}

// Export to global scope (no bundler / modules per the brief's
// "no third-party frameworks" constraint — plain script includes).
window.GCGOValidation = { PATTERNS, validateField, bindFieldValidation };

