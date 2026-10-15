/* ===================================================================
   ADMIN PORTAL LOGIC — MENTAL HEALTH WEEK
   Analytics KPIs, Leaderboard Table, Search/Filter, CSV, QR, & Webhook
   =================================================================== */

import {
  ADMIN_PASS,
  getSubmissions,
  clearSubmissions,
  getWebhookUrl,
  setWebhookUrl
} from './state.js';

let currentFilterCourse = 'ALL';
let currentSearchQuery = '';

export function initAdminDashboard() {
  const loginForm = document.getElementById('admin-login-form');
  const searchInput = document.getElementById('admin-search-input');
  const courseFilter = document.getElementById('admin-course-filter');
  const exportBtn = document.getElementById('admin-export-csv');
  const clearBtn = document.getElementById('admin-clear-data');
  const printQrBtn = document.getElementById('admin-print-qr');
  const saveWebhookBtn = document.getElementById('admin-save-webhook');
  const qrUrlInput = document.getElementById('admin-qr-url');

  if (loginForm) {
    loginForm.onsubmit = e => {
      e.preventDefault();
      verifyAdminPasscode();
    };
  }

  if (searchInput) {
    searchInput.oninput = e => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderLeaderboardTable();
    };
  }

  if (courseFilter) {
    courseFilter.onchange = e => {
      currentFilterCourse = e.target.value;
      renderLeaderboardTable();
    };
  }

  if (exportBtn) exportBtn.onclick = exportLeaderboardCSV;
  if (clearBtn) clearBtn.onclick = handleClearData;
  if (printQrBtn) printQrBtn.onclick = () => window.print();
  if (saveWebhookBtn) saveWebhookBtn.onclick = handleSaveWebhook;

  if (qrUrlInput) {
    qrUrlInput.oninput = updateAdminQRCode;
  }
}

export function verifyAdminPasscode() {
  const passInput = document.getElementById('admin-pass-input');
  const errorMsg = document.getElementById('admin-pass-error');
  const loginCard = document.getElementById('admin-login-card');
  const dashboardCard = document.getElementById('admin-dashboard-view');

  if (!passInput) return;

  if (passInput.value.trim() === ADMIN_PASS) {
    if (errorMsg) errorMsg.style.display = 'none';
    if (loginCard) loginCard.style.display = 'none';
    if (dashboardCard) dashboardCard.style.display = 'block';

    const qrUrlInput = document.getElementById('admin-qr-url');
    const webhookInput = document.getElementById('admin-webhook-input');

    if (qrUrlInput && !qrUrlInput.value) {
      qrUrlInput.value = window.location.href.split('admin.html')[0].split('#')[0];
    }
    if (webhookInput) {
      webhookInput.value = getWebhookUrl();
    }

    updateAdminQRCode();
    renderAllAdminData();
  } else {
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = 'Incorrect passcode. Default passcode: mentalhealth2026';
    }
  }
}

export function renderAllAdminData() {
  const list = getSubmissions();

  // Populate Course Filter dropdown
  populateCourseFilter(list);

  // Render Metric Cards
  renderKPICards(list);

  // Render Champion Spotlight
  renderChampionSpotlight(list);

  // Render Leaderboard
  renderLeaderboardTable();

  if (window.lucide) window.lucide.createIcons();
}

function renderKPICards(list) {
  const totalCountEl = document.getElementById('kpi-total-participants');
  const avgScoreEl = document.getElementById('kpi-avg-score');
  const topScoreEl = document.getElementById('kpi-top-score');
  const completionRateEl = document.getElementById('kpi-completion-rate');

  const count = list.length;
  if (totalCountEl) totalCountEl.textContent = count;

  if (count === 0) {
    if (avgScoreEl) avgScoreEl.textContent = '0 pts';
    if (topScoreEl) topScoreEl.textContent = '0 pts';
    if (completionRateEl) completionRateEl.textContent = '0%';
    return;
  }

  const totalScoreSum = list.reduce((acc, r) => acc + (Number(r.totalScore) || 0), 0);
  const avg = Math.round(totalScoreSum / count);
  const maxScore = Math.max(...list.map(r => Number(r.totalScore) || 0));

  // Count participants who completed all 3 modules
  const completeCount = list.filter(r => (r.cwScore > 0 || r.cwDone) && (r.muScore > 0 || r.muDone) && (r.quizScore > 0 || r.quizDone)).length;
  const rate = Math.round((completeCount / count) * 100);

  if (avgScoreEl) avgScoreEl.textContent = `${avg} pts`;
  if (topScoreEl) topScoreEl.textContent = `${maxScore} pts`;
  if (completionRateEl) completionRateEl.textContent = `${rate}%`;
}

function renderChampionSpotlight(list) {
  const banner = document.getElementById('admin-champion-banner');
  const champName = document.getElementById('champ-name');
  const champMeta = document.getElementById('champ-meta');
  const champScore = document.getElementById('champ-score');
  const champBreakdown = document.getElementById('champ-breakdown');

  const topCwBox = document.getElementById('top-cw-box');
  const topMuBox = document.getElementById('top-mu-box');
  const topQuizBox = document.getElementById('top-quiz-box');

  if (list.length === 0) {
    if (banner) banner.style.display = 'none';
    if (topCwBox) topCwBox.textContent = 'No submissions yet';
    if (topMuBox) topMuBox.textContent = 'No submissions yet';
    if (topQuizBox) topQuizBox.textContent = 'No submissions yet';
    return;
  }

  const sortedOverall = [...list].sort((a, b) => (b.totalScore - a.totalScore) || (a.totalTime - b.totalTime));
  const topOne = sortedOverall[0];

  if (banner) {
    banner.style.display = 'flex';
    if (champName) champName.textContent = topOne.name;
    if (champMeta) champMeta.textContent = `${topOne.course} • ${topOne.contact || 'No contact'}`;
    if (champScore) champScore.textContent = `${topOne.totalScore} pts`;
    if (champBreakdown) {
      champBreakdown.textContent = `Crossword: ${topOne.cwScore || 0} | Match-Up: ${topOne.muScore || 0} | Quiz: ${topOne.quizScore || 0} (${topOne.totalTime || 0}s)`;
    }
  }

  // Category Leaders
  const topCW = [...list].sort((a, b) => (b.cwScore || 0) - (a.cwScore || 0))[0];
  const topMU = [...list].sort((a, b) => (b.muScore || 0) - (a.muScore || 0))[0];
  const topQuiz = [...list].sort((a, b) => (b.quizScore || 0) - (a.quizScore || 0))[0];

  if (topCwBox) {
    topCwBox.textContent = topCW && topCW.cwScore > 0
      ? `${topCW.name} (${topCW.course}) — ${topCW.cwScore} pts`
      : 'No Crossword scores yet';
  }

  if (topMuBox) {
    topMuBox.textContent = topMU && topMU.muScore > 0
      ? `${topMU.name} (${topMU.course}) — ${topMU.muScore} pts`
      : 'No Match-Up scores yet';
  }

  if (topQuizBox) {
    topQuizBox.textContent = topQuiz && topQuiz.quizScore > 0
      ? `${topQuiz.name} (${topQuiz.course}) — ${topQuiz.quizScore} pts`
      : 'No Quiz scores yet';
  }
}

function populateCourseFilter(list) {
  const courseFilter = document.getElementById('admin-course-filter');
  if (!courseFilter) return;

  const currentSelection = courseFilter.value;
  const courses = Array.from(new Set(list.map(r => r.course).filter(Boolean))).sort();

  courseFilter.innerHTML = '<option value="ALL">All Departments / Courses</option>';
  courses.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    courseFilter.appendChild(opt);
  });

  if (courses.includes(currentSelection)) {
    courseFilter.value = currentSelection;
  }
}

function renderLeaderboardTable() {
  const tbody = document.getElementById('admin-leaderboard-body');
  const countSpan = document.getElementById('admin-table-count');
  if (!tbody) return;

  let list = getSubmissions().sort((a, b) => (b.totalScore - a.totalScore) || (a.totalTime - b.totalTime));

  // Course Filter
  if (currentFilterCourse !== 'ALL') {
    list = list.filter(r => r.course === currentFilterCourse);
  }

  // Search Filter
  if (currentSearchQuery) {
    list = list.filter(r =>
      (r.name || '').toLowerCase().includes(currentSearchQuery) ||
      (r.course || '').toLowerCase().includes(currentSearchQuery) ||
      (r.contact || '').toLowerCase().includes(currentSearchQuery)
    );
  }

  if (countSpan) countSpan.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">
          No participant submissions match your current filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((r, idx) => {
    let rankBadge = `<span class="rank-badge">${idx + 1}</span>`;
    if (idx === 0) rankBadge = `<span class="rank-badge rank-1"><i data-lucide="trophy"></i> 1</span>`;
    else if (idx === 1) rankBadge = `<span class="rank-badge rank-2">2</span>`;
    else if (idx === 2) rankBadge = `<span class="rank-badge rank-3">3</span>`;

    return `
      <tr>
        <td>${rankBadge}</td>
        <td><strong>${escapeHTML(r.name)}</strong></td>
        <td>${escapeHTML(r.course)}</td>
        <td style="color:var(--text-muted); font-size:0.84rem;">${escapeHTML(r.contact || '—')}</td>
        <td>${r.cwScore || 0}</td>
        <td>${r.muScore || 0}</td>
        <td>${r.quizScore || 0}</td>
        <td><strong style="color:var(--primary)">${r.totalScore || 0} pts</strong></td>
        <td style="color:var(--text-muted); font-size:0.84rem;">${r.totalTime || 0}s</td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

export function updateAdminQRCode() {
  const qrInput = document.getElementById('admin-qr-url');
  const qrImg = document.getElementById('admin-qr-img');
  if (!qrImg) return;

  const url = (qrInput && qrInput.value.trim()) || window.location.href.split('admin.html')[0].split('#')[0];
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  qrImg.src = qrApi;
}

export function exportLeaderboardCSV() {
  const list = getSubmissions().sort((a, b) => (b.totalScore - a.totalScore) || (a.totalTime - b.totalTime));
  if (list.length === 0) {
    alert('No participant submissions to export.');
    return;
  }

  const headers = ['Rank', 'Name', 'Course', 'Contact', 'Crossword_Score', 'MatchUp_Score', 'Quiz_Score', 'Total_Score', 'Total_Time_Seconds', 'Timestamp'];
  const rows = list.map((r, i) => [
    i + 1,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.course || '').replace(/"/g, '""')}"`,
    `"${(r.contact || '').replace(/"/g, '""')}"`,
    r.cwScore || 0,
    r.muScore || 0,
    r.quizScore || 0,
    r.totalScore || 0,
    r.totalTime || 0,
    `"${r.timestamp || ''}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Mental_Health_Week_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

function handleClearData() {
  if (confirm('Are you sure you want to delete all stored submissions from this device? This action cannot be undone.')) {
    clearSubmissions();
    renderAllAdminData();
  }
}

async function handleSaveWebhook() {
  const webhookInput = document.getElementById('admin-webhook-input');
  const url = webhookInput ? webhookInput.value.trim() : '';
  setWebhookUrl(url);

  if (!url) {
    alert('Webhook URL cleared.');
    return;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const imported = data.map((r, idx) => ({
        id: idx,
        timestamp: r[0],
        name: r[1],
        contact: r[2],
        course: r[3],
        cwScore: Number(r[4]) || 0,
        muScore: Number(r[5]) || 0,
        quizScore: Number(r[6]) || 0,
        totalScore: Number(r[7]) || 0,
        totalTime: Number(r[8]) || 0
      }));
      localStorage.setItem('mhw_submissions_2026', JSON.stringify(imported));
      renderAllAdminData();
      alert(`Connected and imported ${imported.length} submissions from Google Sheets!`);
    } else {
      alert('Webhook saved! New submissions will automatically push to your Google Sheet.');
    }
  } catch (err) {
    alert('Webhook URL saved! Submissions will post to your Google Sheet.');
  }
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
