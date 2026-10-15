/* ===================================================================
   MATCH-UP GAME ENGINE — MENTAL HEALTH WEEK
   8 Wellbeing Habit Icons matched with Statements and Actionable Insights
   =================================================================== */

import { MATCHUP_DATA } from './data.js';
import { getSessionData, updateSessionData } from './state.js';

let selectedLeftTile = null;
let matchedCount = 0;
let slipCount = 0;
let matchStartTime = 0;
let matchTimer = null;
let initialized = false;

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initMatchUp(onReturnCallback) {
  if (initialized) return;
  initialized = true;

  const restartBtn = document.getElementById('mu-restart-btn');
  const returnBtn = document.getElementById('mu-return-btn');
  const saveBtn = document.getElementById('mu-save-btn');

  if (restartBtn) restartBtn.onclick = startMatchUp;
  if (returnBtn && onReturnCallback) returnBtn.onclick = onReturnCallback;
  if (saveBtn && onReturnCallback) saveBtn.onclick = onReturnCallback;
}

export function openMatchUp() {
  const session = getSessionData();
  if (!session.muDone && matchedCount === 0) {
    startMatchUp();
  } else {
    if (window.lucide) window.lucide.createIcons();
  }
}

export function startMatchUp() {
  const leftCol = document.getElementById('match-left-col');
  const rightCol = document.getElementById('match-right-col');
  const insightBox = document.getElementById('match-insight');
  const statusEl = document.getElementById('match-status-msg');

  if (!leftCol || !rightCol) return;

  leftCol.innerHTML = '';
  rightCol.innerHTML = '';
  matchedCount = 0;
  slipCount = 0;
  selectedLeftTile = null;
  matchStartTime = Date.now();

  updateSessionData({ muDone: false, muSlips: 0 });

  const matchedEl = document.getElementById('mu-matched-count');
  const slipsEl = document.getElementById('mu-slips-count');
  const timerEl = document.getElementById('mu-timer');

  if (matchedEl) matchedEl.textContent = '0';
  if (slipsEl) slipsEl.textContent = '0';
  if (timerEl) timerEl.textContent = '0s';
  if (statusEl) statusEl.textContent = '';
  if (insightBox) {
    insightBox.innerHTML = `
      <i data-lucide="info"></i>
      <span>Select an icon on the left, then select its matching statement on the right.</span>
    `;
  }

  clearInterval(matchTimer);
  matchTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
    updateSessionData({ muTime: elapsed });
    if (timerEl) timerEl.textContent = `${elapsed}s`;
  }, 500);

  // Left column: Icons with topic titles
  const leftIndices = shuffle([...MATCHUP_DATA.keys()]);
  leftIndices.forEach(idx => {
    const item = MATCHUP_DATA[idx];
    const btn = document.createElement('button');
    btn.className = 'match-tile pic';
    btn.setAttribute('aria-label', `Habit: ${item[1]}`);
    btn.dataset.index = idx;
    btn.innerHTML = `
      <i data-lucide="${item[0]}"></i>
      <span class="tile-label">${item[1]}</span>
    `;
    btn.onclick = () => onSelectLeft(btn);
    leftCol.appendChild(btn);
  });

  // Right column: Statement descriptions
  const rightIndices = shuffle([...MATCHUP_DATA.keys()]);
  rightIndices.forEach(idx => {
    const item = MATCHUP_DATA[idx];
    const btn = document.createElement('button');
    btn.className = 'match-tile';
    btn.textContent = item[2];
    btn.dataset.index = idx;
    btn.onclick = () => onSelectRight(btn);
    rightCol.appendChild(btn);
  });

  if (window.lucide) window.lucide.createIcons();
}

function onSelectLeft(tile) {
  if (tile.classList.contains('ok')) return;

  if (selectedLeftTile) {
    selectedLeftTile.classList.remove('sel');
  }

  selectedLeftTile = tile;
  tile.classList.add('sel');

  const insightBox = document.getElementById('match-insight');
  if (insightBox) {
    insightBox.innerHTML = `
      <i data-lucide="hand-metal"></i>
      <span>Now choose the corresponding wellbeing statement on the right.</span>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function onSelectRight(rightTile) {
  if (rightTile.classList.contains('ok')) return;

  const insightBox = document.getElementById('match-insight');

  if (!selectedLeftTile) {
    if (insightBox) {
      insightBox.innerHTML = `
        <i data-lucide="alert-circle"></i>
        <span>Please tap an icon tile on the left first.</span>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
    return;
  }

  const leftIndex = Number(selectedLeftTile.dataset.index);
  const rightIndex = Number(rightTile.dataset.index);

  if (leftIndex === rightIndex) {
    // Correct Match
    selectedLeftTile.classList.remove('sel');
    selectedLeftTile.classList.add('ok');
    rightTile.classList.add('ok');
    selectedLeftTile = null;
    matchedCount++;

    const item = MATCHUP_DATA[leftIndex];
    if (insightBox) {
      insightBox.innerHTML = `
        <i data-lucide="${item[0]}"></i>
        <div><strong>${item[1]}:</strong> ${item[3]}</div>
      `;
    }

    const matchedEl = document.getElementById('mu-matched-count');
    if (matchedEl) matchedEl.textContent = matchedCount;

    recalculateMatchUpScore();

    if (matchedCount === MATCHUP_DATA.length) {
      clearInterval(matchTimer);
      updateSessionData({ muDone: true });
      recalculateMatchUpScore();

      const session = getSessionData();
      const statusEl = document.getElementById('match-status-msg');
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem; color:var(--success); font-weight:700;">
            <i data-lucide="check-circle-2"></i>
            <span>All ${MATCHUP_DATA.length} matched in ${session.muTime}s with ${slipCount} slip${slipCount === 1 ? '' : 's'}! Score: ${session.muScore} pts</span>
          </div>
        `;
      }
    }
  } else {
    // Mismatch
    slipCount++;
    const slipsEl = document.getElementById('mu-slips-count');
    if (slipsEl) slipsEl.textContent = slipCount;

    rightTile.classList.add('bad');
    setTimeout(() => {
      rightTile.classList.remove('bad');
    }, 400);

    if (insightBox) {
      insightBox.innerHTML = `
        <i data-lucide="x-circle" style="color:var(--danger)"></i>
        <span>Not quite. Try matching with a different statement.</span>
      `;
    }
    recalculateMatchUpScore();
  }

  if (window.lucide) window.lucide.createIcons();
}

function recalculateMatchUpScore() {
  const session = getSessionData();
  const speedBonus = matchedCount === MATCHUP_DATA.length ? Math.max(0, 200 - (session.muTime * 2)) : 0;
  const rawScore = (matchedCount * 100) + speedBonus - (slipCount * 25);
  const finalScore = Math.min(1000, Math.max(0, rawScore));

  updateSessionData({
    muScore: finalScore,
    muSlips: slipCount
  });
  return finalScore;
}
