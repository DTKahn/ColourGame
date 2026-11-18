import { Game } from './game.js';
import { ColorPicker } from './picker.js';
import { getFormat } from './formats.js';
import { readableOn, rgbToHex } from './color.js';
import { titleFor } from './scoring.js';
import { getBest, recordScore, getPref, setPref } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const css = ({ r, g, b }) => `rgb(${r} ${g} ${b})`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ROUND_OPTIONS = [5, 10, 20];

const state = {
  rounds: ROUND_OPTIONS.includes(getPref('rounds', 5)) ? getPref('rounds', 5) : 5,
  format: 'hex',
  game: null,
  revealed: false,
};

const el = {
  views: {
    home: $('#view-home'),
    play: $('#view-play'),
    results: $('#view-results'),
  },
  stats: $('#topbar-stats'),
  statRound: $('#stat-round'),
  statScore: $('#stat-score'),
  roundsControl: $('#rounds-control'),
  homeBest: $('#home-best'),
  targetCode: $('#target-code'),
  compare: $('#compare'),
  compareTarget: $('#compare-target'),
  compareGuess: $('#compare-guess'),
  compareTargetCode: $('#compare-target-code'),
  compareGuessCode: $('#compare-guess-code'),
  result: $('#result'),
  resultPoints: $('#result-points'),
  resultRating: $('#result-rating'),
  resultDelta: $('#result-delta'),
  primary: $('#primary-action'),
  resultsScore: $('#results-score'),
  resultsMax: $('#results-max'),
  resultsTagline: $('#results-tagline'),
  resultsBest: $('#results-best'),
  roundList: $('#round-list'),
};

const picker = new ColorPicker($('#picker'), {
  onChange: (rgb) => paintGuess(rgb),
});

// ---------- Views ----------

function showView(name) {
  for (const [key, view] of Object.entries(el.views)) view.hidden = key !== name;
  el.stats.hidden = name !== 'play';
  document.body.dataset.view = name;
  window.scrollTo({ top: 0 });
}

// ---------- Home ----------

function renderHome() {
  for (const btn of el.roundsControl.querySelectorAll('button')) {
    const on = Number(btn.dataset.rounds) === state.rounds;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  }
  const best = getBest({ format: state.format, rounds: state.rounds });
  el.homeBest.hidden = best == null;
  if (best != null) {
    el.homeBest.innerHTML = `Best <strong>${fmt(best)}</strong> / ${fmt(state.rounds * 1000)}`;
  }
  showView('home');
}

el.roundsControl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-rounds]');
  if (!btn) return;
  state.rounds = Number(btn.dataset.rounds);
  setPref('rounds', state.rounds);
  renderHome();
});

el.roundsControl.addEventListener('keydown', (e) => {
  const dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
  if (!dir) return;
  e.preventDefault();
  const i = ROUND_OPTIONS.indexOf(state.rounds);
  state.rounds = ROUND_OPTIONS[(i + dir + ROUND_OPTIONS.length) % ROUND_OPTIONS.length];
  setPref('rounds', state.rounds);
  renderHome();
  el.roundsControl.querySelector('[aria-checked="true"]').focus();
});

// ---------- Play ----------

function startGame() {
  state.game = new Game({ rounds: state.rounds, format: state.format });
  showView('play');
  renderRound();
}

function renderRound() {
  const { game } = state;
  const round = game.current;
  state.revealed = false;

  el.targetCode.textContent = getFormat(game.format).format(round.target);
  el.statRound.textContent = `${game.roundNumber}/${game.totalRounds}`;
  el.statScore.textContent = fmt(game.score);

  el.compare.classList.remove('is-revealed');
  el.result.classList.remove('is-visible');
  el.compareTarget.style.background = css(round.target);

  // Start each round from a fresh, neutral-ish spot so the last answer doesn't leak.
  picker.setHsv({ h: Math.random() * 360, s: 0.5, v: 0.6 });
  picker.setDisabled(false);
  paintGuess(picker.rgb);

  el.primary.textContent = 'Lock in';
}

function paintGuess(rgb) {
  el.compareGuess.style.background = css(rgb);
}

function lockIn() {
  const { game } = state;
  const round = game.submit(picker.rgb);
  state.revealed = true;
  picker.setDisabled(true);

  const label = (node, codeNode, rgb) => {
    node.style.color = readableOn(rgb);
    codeNode.textContent = rgbToHex(rgb);
  };
  label(el.compareTarget, el.compareTargetCode, round.target);
  label(el.compareGuess, el.compareGuessCode, round.guess);
  el.compare.classList.add('is-revealed');

  el.resultRating.textContent = round.rating;
  el.resultDelta.textContent = `ΔE ${round.deltaE.toFixed(1)}`;
  el.result.classList.add('is-visible');
  countUp(el.resultPoints, round.points, { prefix: '+', duration: 700 });
  countUp(el.statScore, game.score, { from: game.score - round.points, duration: 700 });

  el.primary.textContent = game.isLastRound ? 'See results' : 'Next color';
  el.primary.focus({ preventScroll: true });
}

function primaryAction() {
  if (!state.game) return;
  if (!state.revealed) return lockIn();
  if (state.game.next()) renderRound();
  else finishGame();
}

el.primary.addEventListener('click', primaryAction);

// ---------- Results ----------

function finishGame() {
  const { game } = state;
  const mode = { format: game.format, rounds: game.totalRounds };
  const previousBest = getBest(mode);
  // Only celebrate beating an earlier score, not the very first game.
  const isBest = recordScore(mode, game.score) && previousBest != null;

  el.resultsMax.textContent = `/ ${fmt(game.maxScore)}`;
  el.resultsTagline.textContent = titleFor(game.score / game.maxScore);
  el.resultsBest.hidden = !isBest;

  el.roundList.innerHTML = '';
  game.rounds.forEach((round, i) => {
    const li = document.createElement('li');
    li.className = 'round-row';
    li.innerHTML = `
      <span class="round-index">${i + 1}</span>
      <span class="round-swatch" aria-hidden="true">
        <span style="background:${css(round.target)}"></span>
        <span style="background:${css(round.guess)}"></span>
      </span>
      <span class="round-codes">
        <strong>${rgbToHex(round.target)}</strong>
        <span>You picked <code>${rgbToHex(round.guess)}</code></span>
      </span>
      <span class="round-score">
        <strong>${fmt(round.points)}</strong>
        <span>${round.rating}</span>
      </span>`;
    el.roundList.append(li);
  });

  showView('results');
  countUp(el.resultsScore, game.score, { duration: 1100 });
}

// ---------- Helpers ----------

const counters = new WeakMap();

function countUp(node, to, { from = 0, prefix = '', duration = 800 } = {}) {
  cancelAnimationFrame(counters.get(node));
  if (reducedMotion() || to === from) {
    node.textContent = prefix + fmt(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    node.textContent = prefix + fmt(from + (to - from) * eased);
    if (t < 1) counters.set(node, requestAnimationFrame(tick));
  };
  counters.set(node, requestAnimationFrame(tick));
}

// ---------- Global wiring ----------

document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'start') startGame();
  if (action === 'home') {
    state.game = null;
    renderHome();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || el.views.play.hidden) return;
  if (e.target.closest('button')) return; // buttons already activate on Enter
  e.preventDefault();
  primaryAction();
});

renderHome();
