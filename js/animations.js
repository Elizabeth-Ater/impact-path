/* ============================================================
   IMPACTPATH — ADVANCED VISUAL FEATURES
   Four self-contained features, each guarded by a check for its
   own DOM elements so this single file can be safely included on
   every page without erroring where a feature's markup isn't
   present:
     1. Scroll reveal   — fades/slides .reveal elements in on scroll
     2. Particle background — canvas network effect behind the hero
     3. Animated stat counters — count-up numbers on the landing page
     4. FAQ accordion   — smooth expand/collapse via CSS grid-rows
   A fifth export, window.triggerConfetti(), is called by
   results.js once quiz results are ready to display.
   ============================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// 1. SCROLL REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion) {
    // Skip the animation entirely — just show everything immediately.
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // only animate in once
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
});

// ============================================================
// 2. PARTICLE BACKGROUND
// A lightweight "constellation" effect: floating dots that draw
// a faint line between any two that drift close together. Runs
// on every element with class .particle-bg — its sizing is based
// on the canvas's own parent element, so any section can host one
// just by giving that parent position:relative and adding the
// canvas as its first child (see the landing hero and quiz header
// for two working examples).
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (prefersReducedMotion) return;

  document.querySelectorAll('.particle-bg').forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement; // the positioned container to fill
    let particles = [];
    const PARTICLE_COUNT = 40;
    const LINK_DISTANCE = 110;

    function resizeCanvas() {
      canvas.width = host.clientWidth;
      canvas.height = host.clientHeight;
    }

    function makeParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around the edges instead of bouncing, for a calmer drift
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 243, 238, 0.5)';
        ctx.fill();
      });

      // Connect nearby particles with a fading line
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45, 212, 167, ${0.15 * (1 - dist / LINK_DISTANCE)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    resizeCanvas();
    makeParticles();
    requestAnimationFrame(step);

    window.addEventListener('resize', () => {
      resizeCanvas();
      makeParticles();
    });
  });
});

// ============================================================
// 3. ANIMATED STAT COUNTERS
// Counts each .stat-counter__value up from 0 to its data-target
// once it scrolls into view, honoring an optional decimal place
// count and suffix (e.g. "2.7" + "°C").
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.stat-counter');
  if (!counters.length) return;

  function animateCounter(el) {
    const valueEl = el.querySelector('.stat-counter__value');
    const target = parseFloat(el.dataset.target || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const DURATION_MS = 1200;

    if (prefersReducedMotion) {
      valueEl.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    let start = null;
    function frame(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      valueEl.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => observer.observe(el));
});

// ============================================================
// 4. FAQ ACCORDION
// Single-open accordion: opening one item closes the others.
// Height animation is pure CSS (grid-template-rows 0fr -> 1fr);
// this just toggles the class and updates aria-expanded.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const question = item.querySelector('.faq-item__question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
});

// ============================================================
// 5. RESULTS-PAGE CONFETTI (called by results.js)
// A one-shot canvas particle burst celebrating quiz completion,
// tinted toward the student's top pillar color when provided.
// ============================================================
window.triggerConfetti = function triggerConfetti(accentHex) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  const palette = ['#F2B705', '#FF6B6B', '#2DD4A7', '#B47AEA'];
  const colors = accentHex ? [accentHex, ...palette] : palette;

  const PIECE_COUNT = 140;
  const DURATION_MS = 2600;

  const pieces = Array.from({ length: PIECE_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    rotation: Math.random() * 360,
    vr: -6 + Math.random() * 12,
    opacity: 1,
  }));

  let start = null;
  function frame(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      if (elapsed > DURATION_MS * 0.6) {
        p.opacity = Math.max(0, 1 - (elapsed - DURATION_MS * 0.6) / (DURATION_MS * 0.4));
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < DURATION_MS) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(frame);
};

