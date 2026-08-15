/* ============================================================
   GCGO ADVISOR — RESULTS PAGE ENGINE
   Reads the quiz results saved to localStorage by js/quiz.js,
   determines the student's top GCGO pillar, renders descriptive
   feedback + recommendations, and draws an animated radar chart
   on a plain <canvas> (2D context, no external libraries).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const CATEGORY_ORDER = ['education', 'health', 'climate', 'women']; // N, E, S, W — matches the compass motif
  const HEX = { education: '#F2B705', health: '#FF6B6B', climate: '#2DD4A7', women: '#B47AEA' };

  const emptyEl = document.getElementById('results-empty');
  const contentEl = document.getElementById('results-content');

  const raw = localStorage.getItem('gcgo_quiz_results');
  if (!raw) {
    // No quiz has been completed this session — guide the student
    // back to the quiz instead of showing a blank/broken page.
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    return;
  }

  let results;
  try {
    results = JSON.parse(raw);
  } catch (err) {
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  contentEl.style.display = 'block';

  const studentName = localStorage.getItem('gcgo_student_name') || 'Explorer';
  document.getElementById('results-greeting').textContent = `${studentName}, here's your profile`;

  // ---- Determine the top pillar (ties broken by CATEGORY_ORDER) ----
  let topCategory = CATEGORY_ORDER[0];
  let topValue = -Infinity;
  CATEGORY_ORDER.forEach((cat) => {
    if (results.tally[cat] > topValue) {
      topValue = results.tally[cat];
      topCategory = cat;
    }
  });

  const info = PILLAR_INFO[topCategory];

  // Celebrate the completed quiz with a one-shot confetti burst,
  // tinted toward the student's top pillar color (see js/animations.js).
  if (typeof window.triggerConfetti === 'function') {
    window.triggerConfetti(info.hex);
  }

  // ---- Badge / headline / description ----
  const badgeEl = document.getElementById('results-badge');
  badgeEl.style.setProperty('--pillar-color', info.hex);
  document.getElementById('results-pillar-tag').textContent = info.label;
  document.getElementById('results-headline').textContent = info.headline;
  document.getElementById('results-description').textContent = info.description;

  // ---- Recommendations ----
  const recWrap = document.getElementById('results-recommendations');
  recWrap.innerHTML = '';
  info.recommendations.forEach((rec) => {
    const card = document.createElement('article');
    card.className = 'rec-card';
    card.style.setProperty('--pillar-color', info.hex);
    card.innerHTML = `<h3>${rec.title}</h3><p>${rec.blurb}</p>`;
    recWrap.appendChild(card);
  });

  // ---- Stats chips ----
  const minutes = Math.floor(results.timeUsedSeconds / 60).toString().padStart(2, '0');
  const seconds = (results.timeUsedSeconds % 60).toString().padStart(2, '0');
  document.getElementById('stat-time').textContent = `${minutes}:${seconds}`;
  document.getElementById('stat-answered').textContent = `${results.answeredCount}/${results.totalQuestions}`;
  document.getElementById('stat-streak').textContent = results.maxStreak;

  // ---- Category breakdown legend (numeric, next to the chart) ----
  const legendWrap = document.getElementById('results-legend');
  legendWrap.innerHTML = '';
  const maxTallyForScale = Math.max(...CATEGORY_ORDER.map((c) => results.tally[c]), 1);
  CATEGORY_ORDER.forEach((cat) => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
      <span class="legend-row__dot" style="background:${HEX[cat]}"></span>
      <span class="legend-row__label">${PILLAR_INFO[cat].label}</span>
      <span class="legend-row__value">${results.tally[cat].toFixed(1)}</span>
    `;
    legendWrap.appendChild(row);
  });

  // ============================================================
  // CANVAS RADAR CHART — pure 2D context, no external libraries.
  // Animates outward from the center over ~900ms using
  // requestAnimationFrame so the chart visibly "draws itself"
  // based on the student's own result data.
  // ============================================================
  const canvas = document.getElementById('radar-chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 340; // logical CSS pixels
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const center = size / 2;
  const maxRadius = size / 2 - 56; // leave room for axis labels
  const angleFor = { education: -Math.PI / 2, health: 0, climate: Math.PI / 2, women: Math.PI };

  function drawStaticGrid() {
    // Concentric guide rings at 25/50/75/100%
    [0.25, 0.5, 0.75, 1].forEach((frac) => {
      ctx.beginPath();
      ctx.arc(center, center, maxRadius * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 243, 238, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axis lines + labels
    CATEGORY_ORDER.forEach((cat) => {
      const angle = angleFor[cat];
      const x2 = center + Math.cos(angle) * maxRadius;
      const y2 = center + Math.sin(angle) * maxRadius;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(245, 243, 238, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const labelX = center + Math.cos(angle) * (maxRadius + 26);
      const labelY = center + Math.sin(angle) * (maxRadius + 26);
      ctx.fillStyle = HEX[cat];
      ctx.font = '600 12px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PILLAR_INFO[cat].label.split(' ')[0], labelX, labelY);
    });
  }

  function drawDataPolygon(progress) {
    const scaleMax = maxTallyForScale * 1.15; // headroom so the max value doesn't touch the outer ring

    const points = CATEGORY_ORDER.map((cat) => {
      const normalized = Math.min(results.tally[cat] / scaleMax, 1);
      const r = maxRadius * normalized * progress;
      const angle = angleFor[cat];
      return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r, cat };
    });

    // Filled polygon
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = 'rgba(45, 212, 167, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#2DD4A7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertex dots, colored per pillar
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = HEX[p.cat];
      ctx.fill();
      ctx.strokeStyle = '#1B1F3B';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  const DURATION_MS = 900;
  let startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / DURATION_MS, 1);
    const eased = easeOutCubic(rawProgress);

    ctx.clearRect(0, 0, size, size);
    drawStaticGrid();
    drawDataPolygon(eased);

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
});

