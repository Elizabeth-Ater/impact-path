/* ============================================================
   GCGO ADVISOR — QUIZ ENGINE
   Renders questions from QUIZ_QUESTIONS (js/quiz-data.js),
   runs a 30-second-per-question countdown timer, tracks a
   speed/streak scoring multiplier, and hands off final results
   to the Results page via localStorage.

   Navigation is one-way: once "Next" is pressed (or the timer
   expires) the question is locked and the student moves forward
   only — there is no back button and no way to revisit an
   earlier question.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---- Config ----
  const SECONDS_PER_QUESTION = 30;     // each question gets its own fresh 30s countdown
  const QUICK_ANSWER_THRESHOLD = 8;    // seconds — answering faster than this builds a streak
  const MAX_STREAK_BONUS = 5;          // caps the multiplier so early luck can't dominate the result

  // ---- State ----
  let currentIndex = 0;
  let timeRemaining = SECONDS_PER_QUESTION;
  let timerHandle = null;
  let questionStartedAt = Date.now();
  let quizStartedAt = Date.now();
  let streak = 0; 
  let bestStreak = 0; // tracks the highest streak achieved during this quiz session
  let isLocked = false;          // true only during the brief "time's up" transition
  let questionAnswered = false;  // has the current question already been answered?

  const tally = { education: 0, health: 0, climate: 0, women: 0 };
  const answered = new Array(QUIZ_QUESTIONS.length).fill(false);

  // ---- DOM refs ----
  const cardEl = document.getElementById('quiz-card');
  const timerEl = document.getElementById('quiz-timer');
  const timerWrapEl = document.getElementById('quiz-timer-wrap');
  const progressEl = document.getElementById('quiz-progress');
  const nextBtn = document.getElementById('quiz-next-btn');
  const questionCounterEl = document.getElementById('quiz-question-counter');
  const lockOverlay = document.getElementById('quiz-lock-overlay');
  const streakBadge = document.getElementById('quiz-streak');
  const streakCountEl = document.getElementById('quiz-streak-count');
  const factTextEl = document.getElementById('quiz-fact-text');

  // ============================================================
  // CUSTOM PROGRESS INDICATOR
  // Renders one tick per question. Ticks fill in the accent color
  // of whichever pillar that question's chosen option scored
  // highest in, so the bar doubles as a running visual summary.
  // Ticks only ever fill forward — there's no control to re-open
  // a completed tick, matching the one-way navigation.
  // ============================================================
  function buildProgressTicks() {
    progressEl.innerHTML = '';
    QUIZ_QUESTIONS.forEach((_, i) => {
      const tick = document.createElement('span');
      tick.className = 'quiz-progress__tick';
      tick.dataset.index = i;
      progressEl.appendChild(tick);
    });
  }

  function updateProgressTick(index, dominantCategory) {
    const tick = progressEl.querySelector(`[data-index="${index}"]`);
    if (!tick) return;
    tick.classList.add('is-filled', `is-${dominantCategory}`);
  }

  function markTickSkipped(index) {
    const tick = progressEl.querySelector(`[data-index="${index}"]`);
    if (!tick) return;
    tick.classList.add('is-filled', 'is-skipped');
  }

  // ============================================================
  // PER-QUESTION TIMER
  // A fresh 30-second countdown starts every time a new question
  // is rendered. If it reaches zero before the student answers,
  // the question locks (counted as skipped) and the quiz auto-
  // advances — the student can never go back to answer it.
  // ============================================================
  function formatTime(seconds) {
    return `00:${Math.max(seconds, 0).toString().padStart(2, '0')}`;
  }

  function startQuestionTimer() {
    clearInterval(timerHandle);
    timeRemaining = SECONDS_PER_QUESTION;
    timerWrapEl.classList.remove('is-warning');
    timerEl.textContent = formatTime(timeRemaining);

    timerHandle = setInterval(() => {
      timeRemaining -= 1;
      timerEl.textContent = formatTime(timeRemaining);

      if (timeRemaining <= 10) {
        timerWrapEl.classList.add('is-warning');
      }

      if (timeRemaining <= 0) {
        clearInterval(timerHandle);
        handleQuestionTimeout();
      }
    }, 1000);
  }

  function handleQuestionTimeout() {
    if (questionAnswered) return; // safety: shouldn't fire if already answered
    isLocked = true;

    // Lock this question's controls and show a brief inline
    // "time's up" state before auto-advancing — no full quiz
    // lockout, just this one question, since the timer restarts
    // fresh on the next question.
    cardEl.querySelectorAll('button, input, video, audio').forEach((el) => (el.disabled = true));
    markTickSkipped(currentIndex);
    streak = 0; // an unanswered question breaks the speed streak
    updateStreakBadge();

    lockOverlay.querySelector('h2').textContent = "Time's up";
    lockOverlay.querySelector('p').textContent = 'Moving to the next question…';
    lockOverlay.classList.add('is-visible', 'is-brief');

    setTimeout(() => {
      lockOverlay.classList.remove('is-visible', 'is-brief');
      isLocked = false;
      advance();
    }, 1100);
  }

  // ============================================================
  // SCORING
  // Applies a speed/streak multiplier: answering within the quick
  // threshold builds a streak; the streak scales up the points
  // awarded (capped), rewarding confident, decisive answering
  // without punishing someone who pauses to think.
  // ============================================================
  // Shows/hides the live streak badge in the header — only appears
  // once a streak of 2+ quick answers is building, so it doesn't
  // clutter the header on questions 1 and after any reset.
  function updateStreakBadge() {
    if (!streakBadge || !streakCountEl) return;
    if (streak >= 2) {
      streakCountEl.textContent = streak;
      streakBadge.style.display = 'flex';
    } else {
      streakBadge.style.display = 'none';
    }
  }

  function recordAnswer(scoresAwarded) {
    const elapsedSeconds = (Date.now() - questionStartedAt) / 1000;
    const wasQuick = elapsedSeconds <= QUICK_ANSWER_THRESHOLD;

    streak = wasQuick ? Math.min(streak + 1, MAX_STREAK_BONUS) : 0;
    bestStreak = Math.max(bestStreak, streak);
    const multiplier = 1 + streak * 0.1;
    updateStreakBadge();

    let dominantCategory = null;
    let dominantValue = -Infinity;

    Object.entries(scoresAwarded).forEach(([category, points]) => {
      const awarded = points * multiplier;
      tally[category] += awarded;
      if (points > dominantValue) {
        dominantValue = points;
        dominantCategory = category;
      }
    });

    return dominantCategory;
  }

  // ============================================================
  // RENDERING — one function per question type, sharing the same
  // card shell and Next-button wiring.
  // ============================================================
  function renderQuestion(index) {
    const q = QUIZ_QUESTIONS[index];
    questionStartedAt = Date.now();
    questionAnswered = false;
    nextBtn.disabled = true;
    nextBtn.textContent = index === QUIZ_QUESTIONS.length - 1 ? 'See my results' : 'Next question';
    questionCounterEl.textContent = `Question ${index + 1} of ${QUIZ_QUESTIONS.length}`;

    // Swap the "Did you know?" sidebar fact to match this question
    if (factTextEl && window.QUIZ_FACTS && window.QUIZ_FACTS[index]) {
      factTextEl.textContent = window.QUIZ_FACTS[index];
    }

    cardEl.classList.remove('quiz-card--enter');
    void cardEl.offsetWidth; // restart the entrance animation on each new question
    cardEl.classList.add('quiz-card--enter');

    const promptEl = document.createElement('h2');
    promptEl.className = 'quiz-card__prompt';
    promptEl.textContent = q.prompt;

    cardEl.innerHTML = '';
    cardEl.appendChild(promptEl);

    if (q.type === 'choice') renderChoice(q);
    else if (q.type === 'hotspot') renderHotspot(q);
    else if (q.type === 'audio') renderAudio(q);
    else if (q.type === 'video') renderVideo(q);

    startQuestionTimer();
  }

  function selectOption(chosenOption, index) {
    if (isLocked || questionAnswered) return; // once answered (or timed out), the choice is final
    questionAnswered = true;
    const dominant = recordAnswer(chosenOption.scores);
    answered[index] = true;
    updateProgressTick(index, dominant || Object.keys(chosenOption.scores)[0]);
    nextBtn.disabled = false;
  }

  // ---- Standard multiple-choice card ----
  function renderChoice(q) {
    const list = document.createElement('div');
    list.className = 'quiz-options';

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (questionAnswered) return;
        list.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectOption(opt, currentIndex);
      });
      list.appendChild(btn);
    });

    cardEl.appendChild(list);
  }

  // ---- Image hotspot card: an SVG compass where each cardinal
  // region is a clickable hotspot, coordinate-mapped to a pillar ----
  function renderHotspot(q) {
    const wrap = document.createElement('div');
    wrap.className = 'hotspot-wrap';
    wrap.innerHTML = `
      <svg viewBox="0 0 300 300" class="hotspot-svg" role="group" aria-label="Compass with four clickable zones">
        <circle cx="150" cy="150" r="120" class="hotspot-ring"/>
        <g class="hotspot-zone" data-zone="north" tabindex="0" role="button" aria-label="North — Education">
          <circle cx="150" cy="45" r="34"/>
          <text x="150" y="51" text-anchor="middle">N</text>
        </g>
        <g class="hotspot-zone" data-zone="east" tabindex="0" role="button" aria-label="East — Health">
          <circle cx="255" cy="150" r="34"/>
          <text x="255" y="156" text-anchor="middle">E</text>
        </g>
        <g class="hotspot-zone" data-zone="south" tabindex="0" role="button" aria-label="South — Climate Change">
          <circle cx="150" cy="255" r="34"/>
          <text x="150" y="261" text-anchor="middle">S</text>
        </g>
        <g class="hotspot-zone" data-zone="west" tabindex="0" role="button" aria-label="West — Women Empowerment">
          <circle cx="45" cy="150" r="34"/>
          <text x="45" y="156" text-anchor="middle">W</text>
        </g>
      </svg>
      <p class="hotspot-caption">Click or press Enter on a zone.</p>
    `;
    cardEl.appendChild(wrap);

    const zones = wrap.querySelectorAll('.hotspot-zone');
    function pick(zoneEl) {
      if (questionAnswered) return;
      const zoneName = zoneEl.dataset.zone;
      const opt = q.options.find((o) => o.zone === zoneName);
      zones.forEach((z) => z.classList.remove('is-selected'));
      zoneEl.classList.add('is-selected');
      selectOption(opt, currentIndex);
    }
    zones.forEach((zoneEl) => {
      zoneEl.addEventListener('click', () => pick(zoneEl));
      zoneEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(zoneEl); }
      });
    });
  }

  // ---- Audio question: custom play/pause/replay controls, plus
  // a text transcript fallback so the question is answerable even
  // without sound (accessibility + in case no audio file is present) ----
  function renderAudio(q) {
    const wrap = document.createElement('div');
    wrap.className = 'media-wrap';
    wrap.innerHTML = `
      <audio id="quiz-audio" src="${q.audioSrc}" preload="none"></audio>
      <div class="media-controls">
        <button type="button" class="btn btn--ghost" id="audio-play">▶ Play prompt</button>
        <button type="button" class="btn btn--text" id="audio-replay">⟲ Replay</button>
      </div>
      <p class="media-transcript"><strong>Transcript:</strong> ${q.transcript}</p>
    `;
    cardEl.appendChild(wrap);

    const audio = wrap.querySelector('#quiz-audio');
    const playBtn = wrap.querySelector('#audio-play');
    const replayBtn = wrap.querySelector('#audio-replay');

    // Custom JS control events, per the brief — play/pause/replay
    // are wired manually rather than using the browser's default UI.
    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => { /* placeholder file may not exist yet — transcript covers it */ });
        playBtn.textContent = '❚❚ Pause prompt';
      } else {
        audio.pause();
        playBtn.textContent = '▶ Play prompt';
      }
    });
    replayBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      playBtn.textContent = '❚❚ Pause prompt';
    });
    audio.addEventListener('ended', () => { playBtn.textContent = '▶ Play prompt'; });

    renderOptionsBelow(q);
  }

  // ---- Video scenario: auto-pauses at a set timestamp via the
  // 'timeupdate' listener, then reveals the decision options ----
  function renderVideo(q) {
    const wrap = document.createElement('div');
    wrap.className = 'media-wrap';
    wrap.innerHTML = `
      <video id="quiz-video" src="${q.videoSrc}" controls preload="auto" playsinline></video>
      <p class="media-transcript"><strong>Scenario so far:</strong> ${q.transcript}</p>
      <p class="media-hint" id="video-hint">Play the clip — it will pause automatically so you can decide.</p>
    `;
    cardEl.appendChild(wrap);

    const video = wrap.querySelector('#quiz-video');
    const hint = wrap.querySelector('#video-hint');
    let hasPaused = false;

    video.addEventListener('timeupdate', () => {
      if (!hasPaused && video.currentTime >= q.pauseAt) {
        video.pause();
        hasPaused = true;
        hint.textContent = 'Paused — choose how the scenario continues below.';
        renderOptionsBelow(q);
      }
    });

    // Fallback: if the clip finishes playing before ever reaching
    // pauseAt (e.g. pauseAt is set close to or past the actual clip
    // length, or the browser's timeupdate ticks skip past the exact
    // threshold), reveal the options anyway instead of leaving the
    // question hanging with no way to proceed.
    video.addEventListener('ended', () => {
      if (!hasPaused) {
        hasPaused = true;
        hint.textContent = 'Choose how the scenario continues below.';
        renderOptionsBelow(q);
      }
    });

    // Fallback: if the placeholder video file can't load, let the
    // student proceed straight to the decision from the transcript.
    video.addEventListener('error', () => {
      if (!hasPaused) {
        hasPaused = true;
        hint.textContent = 'Clip unavailable — deciding from the transcript above.';
        renderOptionsBelow(q);
      }
    });
  }

  // Shared helper: renders the multiple-choice options underneath
  // a media question, once the student has listened/watched.
  function renderOptionsBelow(q) {
    if (cardEl.querySelector('.quiz-options')) return; // already rendered
    const list = document.createElement('div');
    list.className = 'quiz-options';
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (questionAnswered) return;
        list.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectOption(opt, currentIndex);
      });
      list.appendChild(btn);
    });
    cardEl.appendChild(list);
  }

  // ============================================================
  // NAVIGATION + SUBMIT
  // One-way only: pressing Next (or timing out) locks the current
  // question for good and moves forward. currentIndex never
  // decreases, and no "back" control exists anywhere in the DOM.
  // ============================================================
  function advance() {
    clearInterval(timerHandle);
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      currentIndex += 1;
      renderQuestion(currentIndex);
    } else {
      submitQuiz();
    }
  }

  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;
    advance();
  });

  function submitQuiz() {
    clearInterval(timerHandle);
    const results = {
      tally,
      answeredCount: answered.filter(Boolean).length,
      totalQuestions: QUIZ_QUESTIONS.length,
      timeUsedSeconds: Math.round((Date.now() - quizStartedAt) / 1000),
      maxStreak: bestStreak,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('gcgo_quiz_results', JSON.stringify(results));
    window.location.href = 'results.html';
  }

  // ============================================================
  // PRE-QUIZ GATE
  // The quiz itself (#quiz-app) stays hidden until the student
  // ticks the agreement checkbox and clicks "Start the quiz".
  // Only then does the real init (progress ticks, timer, first
  // question) actually run.
  // ============================================================
  const quizAppEl = document.getElementById('quiz-app');
  const agreeCheckbox = document.getElementById('quiz-gate-checkbox');
  const startBtn = document.getElementById('quiz-gate-start-btn');

  function beginQuiz() {
    if (quizAppEl) quizAppEl.style.display = 'block';
    buildProgressTicks();
    quizStartedAt = Date.now();
    renderQuestion(currentIndex);
  }

  if (agreeCheckbox && startBtn) {
    agreeCheckbox.addEventListener('change', () => {
      startBtn.disabled = !agreeCheckbox.checked;
    });
    startBtn.addEventListener('click', () => {
      if (startBtn.disabled) return;
      document.querySelector('.quiz-gate').style.display = 'none';
      beginQuiz();
    });
  }
});

