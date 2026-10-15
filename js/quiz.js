/* ===================================================================
   QUIZ ENGINE — MENTAL HEALTH WEEK
   Interactive Wellbeing Quiz derived from evidence-based statements
   =================================================================== */

import { QUIZ_DATA } from './data.js';
import { getSessionData, updateSessionData } from './state.js';

let currentQuestionIndex = 0;
let userAnswers = [];
let quizTimer = null;
let quizStartTime = 0;
let initialized = false;
let onFinishCallback = null;

export function initQuiz(onReturn) {
  if (initialized) return;
  initialized = true;
  onFinishCallback = onReturn;

  const nextBtn = document.getElementById('quiz-next-btn');
  const returnBtn = document.getElementById('quiz-return-btn');
  const restartBtn = document.getElementById('quiz-restart-btn');

  if (nextBtn) nextBtn.onclick = onNextQuestionClicked;
  if (returnBtn && onReturn) returnBtn.onclick = onReturn;
  if (restartBtn) restartBtn.onclick = restartQuiz;
}

export function openQuiz() {
  const session = getSessionData();
  if (!session.quizDone && userAnswers.length === 0) {
    restartQuiz();
  } else {
    renderCurrentQuestion();
  }
}

export function restartQuiz() {
  currentQuestionIndex = 0;
  userAnswers = [];
  quizStartTime = Date.now();

  updateSessionData({
    quizScore: 0,
    quizDone: false,
    quizCorrect: 0,
    quizTotal: QUIZ_DATA.length
  });

  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    const session = getSessionData();
    if (!session.quizDone) {
      const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
      updateSessionData({ quizTime: elapsed });
      const timerEl = document.getElementById('quiz-timer');
      if (timerEl) timerEl.textContent = `${elapsed}s`;
    }
  }, 500);

  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = QUIZ_DATA[currentQuestionIndex];
  if (!q) return;

  // Update progress bar
  const progressPercent = Math.round(((currentQuestionIndex + 1) / QUIZ_DATA.length) * 100);
  const fillEl = document.getElementById('quiz-progress-fill');
  const countEl = document.getElementById('quiz-question-counter');

  if (fillEl) fillEl.style.width = `${progressPercent}%`;
  if (countEl) countEl.textContent = `Question ${currentQuestionIndex + 1} of ${QUIZ_DATA.length}`;

  // Topic badge and question title
  const badgeEl = document.getElementById('quiz-topic-badge');
  const titleEl = document.getElementById('quiz-question-text');
  if (badgeEl) {
    badgeEl.innerHTML = `<i data-lucide="${q.icon}"></i> <span>${q.topic}</span>`;
  }
  if (titleEl) {
    titleEl.textContent = q.question;
  }

  // Options list
  const optionsContainer = document.getElementById('quiz-options-container');
  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    const answered = userAnswers[currentQuestionIndex] !== undefined;
    const selectedIdx = answered ? userAnswers[currentQuestionIndex] : null;

    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerHTML = `
        <span class="quiz-option-key">${letters[optIdx]}</span>
        <span>${optText}</span>
      `;

      if (answered) {
        btn.disabled = true;
        if (optIdx === q.correctIndex) {
          btn.classList.add('correct');
        } else if (optIdx === selectedIdx) {
          btn.classList.add('wrong');
        }
      } else {
        btn.onclick = () => selectOption(optIdx);
      }

      optionsContainer.appendChild(btn);
    });
  }

  // Explanation box & Next button
  const explanationBox = document.getElementById('quiz-explanation-box');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (userAnswers[currentQuestionIndex] !== undefined) {
    if (explanationBox) {
      explanationBox.hidden = false;
      const isCorrect = userAnswers[currentQuestionIndex] === q.correctIndex;
      explanationBox.innerHTML = `
        <i data-lucide="${isCorrect ? 'check-circle' : 'info'}"></i>
        <div>
          <strong>${isCorrect ? 'Correct!' : 'Key Takeaway:'}</strong> ${q.explanation}
        </div>
      `;
    }
    if (nextBtn) {
      nextBtn.hidden = false;
      nextBtn.textContent = currentQuestionIndex === QUIZ_DATA.length - 1
        ? 'Complete Quiz →'
        : 'Next Question →';
    }
  } else {
    if (explanationBox) explanationBox.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
  }

  if (window.lucide) window.lucide.createIcons();
}

function selectOption(optionIndex) {
  const q = QUIZ_DATA[currentQuestionIndex];
  if (!q || userAnswers[currentQuestionIndex] !== undefined) return;

  userAnswers[currentQuestionIndex] = optionIndex;
  const isCorrect = optionIndex === q.correctIndex;

  // Calculate Running Score
  const session = getSessionData();
  const currentCorrect = userAnswers.reduce((acc, ans, idx) => {
    return acc + (ans === QUIZ_DATA[idx].correctIndex ? 1 : 0);
  }, 0);

  // Score algorithm: 100 pts per correct answer + speed bonus up to 200 pts for quick total completion
  const rawScore = (currentCorrect * 100);
  const speedBonus = currentCorrect === QUIZ_DATA.length ? Math.max(0, 200 - Math.floor(session.quizTime / 2)) : 0;
  const totalQuizScore = Math.min(1000, rawScore + speedBonus);

  updateSessionData({
    quizCorrect: currentCorrect,
    quizScore: totalQuizScore
  });

  renderCurrentQuestion();
}

function onNextQuestionClicked() {
  if (currentQuestionIndex < QUIZ_DATA.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  } else {
    // Finished
    finishQuiz();
  }
}

function finishQuiz() {
  clearInterval(quizTimer);
  const session = getSessionData();
  const totalCorrect = userAnswers.reduce((acc, ans, idx) => {
    return acc + (ans === QUIZ_DATA[idx].correctIndex ? 1 : 0);
  }, 0);

  const speedBonus = Math.max(0, 200 - Math.floor(session.quizTime / 2));
  const finalScore = Math.min(1000, (totalCorrect * 100) + (totalCorrect >= 6 ? speedBonus : 0));

  updateSessionData({
    quizDone: true,
    quizCorrect: totalCorrect,
    quizScore: finalScore
  });

  if (typeof onFinishCallback === 'function') {
    onFinishCallback();
  }
}
