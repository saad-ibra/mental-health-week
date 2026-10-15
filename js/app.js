/* ===================================================================
   APP COORDINATOR — MENTAL HEALTH WEEK
   View Routing, Theme Switcher, Session Lifecycle, and Toast System
   =================================================================== */

import {
  getCurrentUser,
  setCurrentUser,
  getSessionData,
  getTotalScore,
  getTotalTime,
  saveSubmission,
  syncWithWebhook,
  resetSession,
  THEME_KEY
} from './state.js';
import { initCrossword, openCrossword, evaluateCrossword } from './crossword.js';
import { initMatchUp, openMatchUp } from './matchup.js';
import { initQuiz, openQuiz } from './quiz.js';
import { SUPPORT_RESOURCES } from './data.js';

export function initApp() {
  initTheme();
  setupEventListeners();

  // Initialize Game Engines
  initCrossword(() => showView('view-hub'));
  initMatchUp(() => showView('view-hub'));
  initQuiz(() => showView('view-hub'));

  renderHelplineResources();

  // If user navigated directly or refreshed
  if (getCurrentUser()) {
    showView('view-hub');
  } else {
    showView('view-register');
  }

  window.showHub = () => showView('view-hub');
  window.showView = showView;

  if (window.lucide) window.lucide.createIcons();
}

/* ================= VIEW ROUTING ================= */
export function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // View specific hooks
  if (viewId === 'view-hub') {
    refreshHubUI();
  } else if (viewId === 'view-crossword') {
    openCrossword();
  } else if (viewId === 'view-matchup') {
    openMatchUp();
  } else if (viewId === 'view-quiz') {
    openQuiz();
  }

  if (window.lucide) window.lucide.createIcons();
}

/* ================= HUB UI REFRESH ================= */
function refreshHubUI() {
  const session = getSessionData();
  const user = getCurrentUser();

  // Update navbar user pill
  const userPill = document.getElementById('nav-user-pill');
  const userArea = document.getElementById('nav-user-area');
  if (user && userPill && userArea) {
    userPill.innerHTML = `<i data-lucide="user"></i> <span>${escapeHTML(user.name)} (${escapeHTML(user.course)})</span>`;
    userArea.style.display = 'flex';
  }

  // Hub Cards State
  const cwCard = document.getElementById('hub-card-crossword');
  const muCard = document.getElementById('hub-card-matchup');
  const quizCard = document.getElementById('hub-card-quiz');

  if (cwCard) cwCard.classList.toggle('completed', session.cwDone);
  if (muCard) muCard.classList.toggle('completed', session.muDone);
  if (quizCard) quizCard.classList.toggle('completed', session.quizDone);

  // Status Pills
  const cwStatus = document.getElementById('hub-cw-status');
  const muStatus = document.getElementById('hub-mu-status');
  const quizStatus = document.getElementById('hub-quiz-status');

  if (cwStatus) {
    cwStatus.innerHTML = session.cwScore > 0 || session.cwDone
      ? `<i data-lucide="check"></i> Score: ${session.cwScore} pts (${session.cwTime}s)`
      : `<i data-lucide="award"></i> Max 1,000 pts`;
  }

  if (muStatus) {
    muStatus.innerHTML = session.muScore > 0 || session.muDone
      ? `<i data-lucide="check"></i> Score: ${session.muScore} pts (${session.muTime}s)`
      : `<i data-lucide="award"></i> Max 1,000 pts`;
  }

  if (quizStatus) {
    quizStatus.innerHTML = session.quizScore > 0 || session.quizDone
      ? `<i data-lucide="check"></i> Score: ${session.quizScore} pts (${session.quizCorrect}/${session.quizTotal})`
      : `<i data-lucide="award"></i> Max 1,000 pts`;
  }

  // Total Score & Badge
  const totalScoreEl = document.getElementById('hub-total-score');
  if (totalScoreEl) {
    totalScoreEl.textContent = `${getTotalScore()} pts`;
  }

  if (window.lucide) window.lucide.createIcons();
}

/* ================= EVENT LISTENERS ================= */
function setupEventListeners() {
  // Registration Form
  const regForm = document.getElementById('participant-reg-form');
  if (regForm) {
    regForm.onsubmit = e => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const contact = document.getElementById('reg-contact').value.trim();
      const course = document.getElementById('reg-course').value.trim();

      if (!name || !course) {
        showToast('Please enter your Name and Course.', 'error');
        return;
      }

      setCurrentUser({ name, contact, course });
      showToast(`Welcome, ${name}! Activities unlocked.`, 'success');
      showView('view-hub');
    };
  }

  // Hub Play Buttons
  const playCwBtn = document.getElementById('btn-play-crossword');
  const playMuBtn = document.getElementById('btn-play-matchup');
  const playQuizBtn = document.getElementById('btn-play-quiz');
  const submitFinalBtn = document.getElementById('btn-submit-final');

  if (playCwBtn) playCwBtn.onclick = () => showView('view-crossword');
  if (playMuBtn) playMuBtn.onclick = () => showView('view-matchup');
  if (playQuizBtn) playQuizBtn.onclick = () => showView('view-quiz');
  if (submitFinalBtn) submitFinalBtn.onclick = handleFinalSubmission;

  // New Participant Session
  const newSessionBtn = document.getElementById('btn-new-participant');
  if (newSessionBtn) newSessionBtn.onclick = resetForNextParticipant;

  // Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.onclick = toggleTheme;
}

/* ================= FINAL SUBMISSION ================= */
async function handleFinalSubmission() {
  const user = getCurrentUser();
  if (!user) {
    showView('view-register');
    return;
  }

  evaluateCrossword();
  const session = getSessionData();
  const totalScore = getTotalScore();
  const totalTime = getTotalTime();

  const record = {
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    name: user.name,
    contact: user.contact,
    course: user.course,
    cwScore: session.cwScore || 0,
    muScore: session.muScore || 0,
    quizScore: session.quizScore || 0,
    totalScore: totalScore,
    totalTime: totalTime
  };

  saveSubmission(record);

  // Sync to Google Sheets if configured
  syncWithWebhook(record);

  // Populate Thank You View
  const tyName = document.getElementById('ty-participant-name');
  const tyCourse = document.getElementById('ty-participant-course');
  const tyScore = document.getElementById('ty-participant-score');
  const tyBreakdown = document.getElementById('ty-participant-breakdown');

  if (tyName) tyName.textContent = user.name;
  if (tyCourse) tyCourse.textContent = user.course;
  if (tyScore) tyScore.textContent = `${totalScore} pts`;

  const activities = [];
  if (session.cwScore > 0 || session.cwDone) activities.push(`Crossword: ${session.cwScore} pts`);
  if (session.muScore > 0 || session.muDone) activities.push(`Match-Up: ${session.muScore} pts`);
  if (session.quizScore > 0 || session.quizDone) activities.push(`Quiz: ${session.quizScore} pts`);

  if (tyBreakdown) {
    tyBreakdown.textContent = activities.length > 0
      ? activities.join(' • ')
      : 'Activities recorded.';
  }

  // Hide nav user pill
  const userArea = document.getElementById('nav-user-area');
  if (userArea) userArea.style.display = 'none';

  showToast('Submission recorded successfully!', 'success');
  showView('view-thanks');
}

function resetForNextParticipant() {
  const regForm = document.getElementById('participant-reg-form');
  if (regForm) regForm.reset();
  setCurrentUser(null);
  resetSession();
  showView('view-register');
}

/* ================= HELPLINE RESOURCES ================= */
function renderHelplineResources() {
  const container = document.getElementById('helpline-resources-list');
  if (!container) return;

  container.innerHTML = SUPPORT_RESOURCES.map(r => `
    <div class="card" style="padding:1rem; border-left:3px solid var(--primary); display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
      <div>
        <div style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${r.name}</div>
        <div style="color:var(--text-muted); font-size:0.85rem; margin-top:0.2rem;">${r.desc}</div>
      </div>
      <span class="badge badge-teal">${r.badge}</span>
    </div>
  `).join('');
}

/* ================= THEME MANAGEMENT ================= */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const iconSlot = document.getElementById('theme-icon-slot');
  if (iconSlot) {
    iconSlot.innerHTML = theme === 'dark'
      ? '<i data-lucide="sun"></i>'
      : '<i data-lucide="moon"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

/* ================= TOAST NOTIFICATION SYSTEM ================= */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.25s forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// Auto-boot upon script load
document.addEventListener('DOMContentLoaded', initApp);
