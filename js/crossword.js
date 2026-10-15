/* ===================================================================
   CROSSWORD PUZZLE ENGINE — MENTAL HEALTH WEEK
   10 Clues with Lucide Icons, Keyboard Navigation, Hints, and Scoring
   =================================================================== */

import { CROSSWORD_DATA } from './data.js';
import { getSessionData, updateSessionData } from './state.js';

let cells = {};
let words = [];
let act = 0;
let cwTimer = null;
let cwStartTime = 0;
let initialized = false;

export function initCrossword(onReturnCallback) {
  if (initialized) return;
  initialized = true;

  const g = document.getElementById('grid');
  const acrossContainer = document.getElementById('across-clues');
  const downContainer = document.getElementById('down-clues');

  if (!g) return;

  cells = {};
  words = [];

  // Build word objects and cell mappings
  CROSSWORD_DATA.forEach((x, i) => {
    const [w, r, c, d, icon, cl, tip] = x;
    const o = { w, r, c, d, icon, cl, tip, cs: [] };
    for (let k = 0; k < w.length; k++) {
      const rr = r + (d === "D" ? k : 0);
      const cc = c + (d === "A" ? k : 0);
      const key = `${rr},${cc}`;
      (cells[key] = cells[key] || { r: rr, c: cc, ch: w[k], ws: [] }).ws.push(i);
      o.cs.push(key);
    }
    words.push(o);
  });

  // Calculate numbers
  let num = 0;
  const nums = {};
  Object.values(cells)
    .sort((a, b) => a.r - b.r || a.c - b.c)
    .forEach(c => {
      const isStart = c.ws.some(i => words[i].cs[0] === `${c.r},${c.c}`);
      if (isStart) nums[`${c.r},${c.c}`] = ++num;
    });

  words.forEach(w => {
    w.n = nums[w.cs[0]];
  });

  // Render Grid
  g.innerHTML = '';
  const maxR = Math.max(...Object.values(cells).map(c => c.r)) + 1;
  for (let r = 0; r < maxR; r++) {
    for (let c = 0; c < 15; c++) {
      const k = `${r},${c}`;
      const d = document.createElement('div');
      const cell = cells[k];
      d.className = 'c';

      if (cell) {
        d.classList.add('on');
        cell.el = d;
        const n = nums[k];
        if (n) d.innerHTML = `<span class="n">${n}</span>`;

        const inp = document.createElement('input');
        inp.maxLength = 1;
        inp.autocomplete = 'off';
        inp.setAttribute('aria-label', `Row ${r + 1} column ${c + 1}`);
        cell.in = inp;
        d.appendChild(inp);

        inp.onfocus = () => pick(cell);
        inp.onclick = () => pick(cell, true);

        inp.oninput = () => {
          inp.value = inp.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
          d.classList.remove('ok', 'bad');
          if (inp.value) step(cell, 1);
        };

        inp.onkeydown = e => {
          if (e.key === 'Backspace' && !inp.value) {
            step(cell, -1);
            e.preventDefault();
          }
          const moves = {
            ArrowRight: [0, 1, 'A'],
            ArrowLeft: [0, -1, 'A'],
            ArrowDown: [1, 0, 'D'],
            ArrowUp: [-1, 0, 'D']
          }[e.key];

          if (moves) {
            const target = cells[`${cell.r + moves[0]},${cell.c + moves[1]}`];
            if (target) {
              act = target.ws.find(i => words[i].d === moves[2]) ?? target.ws[0];
              target.in.focus();
              paint();
            }
            e.preventDefault();
          }
        };
      }
      g.appendChild(d);
    }
  }

  // Render Clue Lists
  if (acrossContainer) acrossContainer.innerHTML = '';
  if (downContainer) downContainer.innerHTML = '';

  words.forEach((w, i) => {
    const d = document.createElement('div');
    d.className = 'cl';
    d.dataset.i = i;
    d.innerHTML = `
      <div class="cl-icon"><i data-lucide="${w.icon}"></i></div>
      <div class="cl-text">
        <b>${w.n}.</b> ${w.cl} <small>(${w.w.length} letters)</small>
      </div>
    `;

    d.onclick = () => {
      act = i;
      const emptyCell = cells[w.cs.find(k => !cells[k].in.value) || w.cs[0]];
      emptyCell.in.focus();
      paint();
    };

    if (w.d === 'A' && acrossContainer) {
      acrossContainer.appendChild(d);
    } else if (w.d === 'D' && downContainer) {
      downContainer.appendChild(d);
    }
  });

  // Buttons wiring
  const chkBtn = document.getElementById('cw-chk');
  const hintBtn = document.getElementById('cw-hint');
  const revBtn = document.getElementById('cw-rev');
  const clrBtn = document.getElementById('cw-clr');
  const exitBtn = document.getElementById('cw-exit-btn');
  const saveBtn = document.getElementById('cw-save-btn');

  if (chkBtn) chkBtn.onclick = evaluateCrossword;
  if (hintBtn) hintBtn.onclick = hintCrossword;
  if (revBtn) revBtn.onclick = revealCrossword;
  if (clrBtn) clrBtn.onclick = resetCrossword;
  if (exitBtn && onReturnCallback) exitBtn.onclick = () => saveAndExitCrossword(onReturnCallback);
  if (saveBtn && onReturnCallback) saveBtn.onclick = () => saveAndExitCrossword(onReturnCallback);

  paint();
  if (window.lucide) window.lucide.createIcons();
}

function pick(cell, toggleDirection = false) {
  if (!cell.ws.includes(act)) {
    act = cell.ws[0];
  } else if (toggleDirection && cell.ws.length > 1) {
    act = cell.ws.find(i => i !== act);
  }
  paint();
}

function step(cell, dir) {
  const w = words[act];
  const idx = w.cs.indexOf(`${cell.r},${cell.c}`) + dir;
  if (idx >= 0 && idx < w.cs.length) {
    cells[w.cs[idx]].in.focus();
  }
}

function paint() {
  Object.values(cells).forEach(c => c.el.classList.remove('hi', 'act'));
  if (words[act]) {
    words[act].cs.forEach(k => cells[k].el.classList.add('hi'));
  }
  document.querySelectorAll('.cl').forEach(e => {
    e.classList.toggle('act', Number(e.dataset.i) === act);
  });
}

export function openCrossword() {
  const session = getSessionData();
  if (!cwStartTime) {
    cwStartTime = Date.now() - (session.cwTime * 1000);
  }

  clearInterval(cwTimer);
  cwTimer = setInterval(() => {
    if (!session.cwDone) {
      const elapsed = Math.floor((Date.now() - cwStartTime) / 1000);
      updateSessionData({ cwTime: elapsed });
      const timerEl = document.getElementById('cw-timer');
      if (timerEl) timerEl.textContent = `${elapsed}s`;
    }
  }, 500);

  paint();
  if (window.lucide) window.lucide.createIcons();
}

export function evaluateCrossword() {
  const session = getSessionData();
  let wrong = 0;
  let done = 0;

  Object.values(cells).forEach(c => {
    c.el.classList.remove('ok', 'bad');
    if (c.in.value) {
      const isCorrect = c.in.value === c.ch;
      c.el.classList.add(isCorrect ? 'ok' : 'bad');
      if (!isCorrect) wrong++;
    }
  });

  const insightsList = document.getElementById('cw-insights-list');
  const insightsBox = document.getElementById('cw-insights-box');
  if (insightsList) insightsList.innerHTML = '';

  words.forEach(w => {
    const isWordComplete = w.cs.every(k => cells[k].in.value === cells[k].ch);
    if (isWordComplete) {
      done++;
      if (insightsList) {
        insightsList.innerHTML += `
          <li>
            <i data-lucide="${w.icon}"></i>
            <div>
              <strong>${w.w[0] + w.w.slice(1).toLowerCase()}:</strong> ${w.tip}
            </div>
          </li>
        `;
      }
    }
  });

  if (insightsBox) {
    insightsBox.hidden = done === 0;
  }

  // Scoring
  let score = 0;
  if (session.cwRevealed) {
    score = 0;
  } else {
    const speedBonus = done === words.length ? Math.max(0, 200 - session.cwTime) : 0;
    const raw = (done * 100) + speedBonus - (session.cwHints * 25);
    score = Math.min(1000, Math.max(0, raw));
  }

  const isCompleted = done === words.length;
  updateSessionData({
    cwScore: score,
    cwDone: isCompleted
  });

  if (isCompleted) {
    clearInterval(cwTimer);
  }

  const msg = document.getElementById('cw-status-msg');
  if (msg) {
    if (isCompleted) {
      msg.textContent = `Completed! Final Score: ${score} pts`;
      msg.style.color = 'var(--success)';
    } else if (wrong > 0) {
      msg.textContent = `${wrong} letter(s) need attention. (${done}/${words.length} complete)`;
      msg.style.color = 'var(--danger)';
    } else {
      msg.textContent = `${done} of ${words.length} words solved (${score} pts)`;
      msg.style.color = 'var(--primary)';
    }
  }

  if (window.lucide) window.lucide.createIcons();
  return { score, done, total: words.length, isCompleted };
}

export function hintCrossword() {
  const session = getSessionData();
  const currentWord = words[act];
  if (!currentWord) return;

  const targetKey = currentWord.cs.find(k => cells[k].in.value !== cells[k].ch);
  if (targetKey) {
    updateSessionData({ cwHints: session.cwHints + 1 });
    cells[targetKey].in.value = cells[targetKey].ch;
    cells[targetKey].in.focus();
    evaluateCrossword();
  }
}

export function revealCrossword() {
  if (!confirm('Revealing all answers will set your Crossword score to 0 pts. Would you like to proceed?')) {
    return;
  }
  updateSessionData({ cwRevealed: true });
  Object.values(cells).forEach(c => {
    c.in.value = c.ch;
  });
  evaluateCrossword();
}

export function resetCrossword() {
  Object.values(cells).forEach(c => {
    c.in.value = '';
    c.el.classList.remove('ok', 'bad');
  });
  const msg = document.getElementById('cw-status-msg');
  if (msg) msg.textContent = '';
  const insightsBox = document.getElementById('cw-insights-box');
  if (insightsBox) insightsBox.hidden = true;
  cwStartTime = 0;
  updateSessionData({ cwScore: 0, cwTime: 0, cwDone: false, cwHints: 0, cwRevealed: false });
}

export function saveAndExitCrossword(onReturnCallback) {
  clearInterval(cwTimer);
  evaluateCrossword();
  if (typeof onReturnCallback === 'function') {
    onReturnCallback();
  }
}
