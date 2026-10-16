/* ===================================================================
   ADMIN PORTAL LOGIC — MENTAL HEALTH WEEK
   Analytics KPIs, Leaderboard Table, Search/Filter, CSV, QR, Webhook,
   Firebase Cloud DB Config, Real-time Sync, Submission Inspector
   =================================================================== */

import {
  getAdminPasscode,
  setAdminPasscode,
  getSubmissions,
  clearSubmissions,
  getWebhookUrl,
  setWebhookUrl,
  STORAGE_KEY
} from './state.js';

import {
  initCloudDB,
  saveFirebaseConfig,
  getFirebaseConfig,
  subscribeToSubmissions,
  deleteCloudSubmission,
  testDatabaseConnection,
  getEffectiveWebhookUrl,
  FIREBASE_CONFIG_KEY
} from './db.js';

let currentFilterCourse = 'ALL';
let currentSearchQuery = '';
let unsubscribeRealtime = null;
let currentSubmissions = [];

export function initAdminDashboard() {
  const loginForm = document.getElementById('admin-login-form');
  const searchInput = document.getElementById('admin-search-input');
  const courseFilter = document.getElementById('admin-course-filter');
  const exportBtn = document.getElementById('admin-export-csv');
  const clearBtn = document.getElementById('admin-clear-data');
  const printQrBtn = document.getElementById('admin-print-qr');
  const saveWebhookBtn = document.getElementById('admin-save-webhook');
  const qrUrlInput = document.getElementById('admin-qr-url');
  const changePassBtn = document.getElementById('admin-change-pass-btn');
  const saveFirebaseBtn = document.getElementById('admin-save-firebase');
  const testFirebaseBtn = document.getElementById('admin-test-firebase');

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
  if (saveFirebaseBtn) saveFirebaseBtn.onclick = handleSaveFirebaseConfig;
  if (testFirebaseBtn) testFirebaseBtn.onclick = handleTestFirebaseConnection;

  if (changePassBtn) {
    changePassBtn.onclick = handleChangePasscode;
  }

  if (qrUrlInput) {
    qrUrlInput.oninput = updateAdminQRCode;
  }

  // Initialize Cloud DB
  initCloudDB();

  // Load existing Firebase config into form
  loadFirebaseConfigIntoForm();

  // Setup submission inspector modal close
  setupInspectorModal();
}

function handleChangePasscode() {
  const current = prompt('Enter your current passcode:');
  if (current !== getAdminPasscode()) {
    alert('Current passcode is incorrect.');
    return;
  }
  const newPass = prompt('Enter new private passcode (minimum 6 characters):');
  if (newPass && newPass.trim().length >= 6) {
    setAdminPasscode(newPass.trim());
    alert('Passcode successfully updated! Keep your new passcode safe.');
  } else if (newPass !== null) {
    alert('Passcode must be at least 6 characters long.');
  }
}

export function verifyAdminPasscode() {
  const passInput = document.getElementById('admin-pass-input');
  const errorMsg = document.getElementById('admin-pass-error');
  const loginCard = document.getElementById('admin-login-card');
  const dashboardCard = document.getElementById('admin-dashboard-view');

  if (!passInput) return;

  if (passInput.value.trim() === getAdminPasscode()) {
    if (errorMsg) errorMsg.style.display = 'none';
    if (loginCard) loginCard.style.display = 'none';
    if (dashboardCard) dashboardCard.style.display = 'block';

    const qrUrlInput = document.getElementById('admin-qr-url');
    const webhookInput = document.getElementById('admin-webhook-input');

    if (qrUrlInput && !qrUrlInput.value) {
      qrUrlInput.value = window.location.href.split('admin.html')[0].split('#')[0];
    }
    if (webhookInput) {
      webhookInput.value = getEffectiveWebhookUrl() || getWebhookUrl();
    }

    updateAdminQRCode();

    // Start real-time subscription
    startRealtimeSubscription();

    // Also do a local render as fallback
    renderAllAdminData(getSubmissions());
  } else {
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = 'Incorrect passcode. Access denied.';
    }
  }
}

/* ============ REAL-TIME SUBSCRIPTION ============ */
function startRealtimeSubscription() {
  // Clean up existing subscription
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
  }

  unsubscribeRealtime = subscribeToSubmissions((list, source) => {
    currentSubmissions = list;
    renderAllAdminData(list);

    // Update sync status indicator
    const syncEl = document.getElementById('admin-sync-status');
    if (syncEl) {
      if (source === 'firebase') {
        syncEl.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;color:var(--success);"></i> <span style="color:var(--success);font-weight:600;">Cloud Synced (Firebase)</span>';
      } else if (source === 'webhook') {
        syncEl.innerHTML = '<i data-lucide="cloud" style="width:14px;height:14px;color:var(--success);"></i> <span style="color:var(--success);font-weight:600;">Cloud Synced (Google Sheets)</span>';
      } else {
        syncEl.innerHTML = '<i data-lucide="hard-drive" style="width:14px;height:14px;color:var(--text-muted);"></i> <span style="color:var(--text-muted);font-weight:600;">Local Only (Connect DB below)</span>';
      }
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

/* ============ FIREBASE CONFIG ============ */
function loadFirebaseConfigIntoForm() {
  const config = getFirebaseConfig();
  if (!config) return;

  const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  fields.forEach(key => {
    const el = document.getElementById(`fb-${key}`);
    if (el && config[key]) el.value = config[key];
  });
}

function handleSaveFirebaseConfig() {
  const apiKey = getVal('fb-apiKey');
  const authDomain = getVal('fb-authDomain');
  const projectId = getVal('fb-projectId');
  const storageBucket = getVal('fb-storageBucket');
  const messagingSenderId = getVal('fb-messagingSenderId');
  const appId = getVal('fb-appId');

  if (!apiKey || !projectId) {
    alert('API Key and Project ID are required.');
    return;
  }

  const config = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
  saveFirebaseConfig(config);

  // Restart subscription with new config
  startRealtimeSubscription();

  alert('Firebase configuration saved! Cloud sync is now active.');
}

async function handleTestFirebaseConnection() {
  const apiKey = getVal('fb-apiKey');
  const projectId = getVal('fb-projectId');

  if (!apiKey || !projectId) {
    alert('Please enter at least API Key and Project ID before testing.');
    return;
  }

  const config = {
    apiKey,
    authDomain: getVal('fb-authDomain'),
    projectId,
    storageBucket: getVal('fb-storageBucket'),
    messagingSenderId: getVal('fb-messagingSenderId'),
    appId: getVal('fb-appId')
  };

  const testBtn = document.getElementById('admin-test-firebase');
  if (testBtn) testBtn.disabled = true;

  const result = await testDatabaseConnection(config);

  if (testBtn) testBtn.disabled = false;

  alert(result.message);
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* ============ ADMIN DATA RENDERING ============ */
export function renderAllAdminData(list) {
  if (!list) list = getSubmissions();

  // Populate Course Filter dropdown
  populateCourseFilter(list);

  // Render Metric Cards
  renderKPICards(list);

  // Render Champion Spotlight
  renderChampionSpotlight(list);

  // Render Leaderboard
  renderLeaderboardTable(list);

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
    if (champMeta) champMeta.textContent = `${topOne.course} | ${topOne.contact || 'No contact'}`;
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
      ? `${topCW.name} (${topCW.course}) | ${topCW.cwScore} pts`
      : 'No Crossword scores yet';
  }

  if (topMuBox) {
    topMuBox.textContent = topMU && topMU.muScore > 0
      ? `${topMU.name} (${topMU.course}) | ${topMU.muScore} pts`
      : 'No Match-Up scores yet';
  }

  if (topQuizBox) {
    topQuizBox.textContent = topQuiz && topQuiz.quizScore > 0
      ? `${topQuiz.name} (${topQuiz.course}) | ${topQuiz.quizScore} pts`
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

function renderLeaderboardTable(listOverride) {
  const tbody = document.getElementById('admin-leaderboard-body');
  const countSpan = document.getElementById('admin-table-count');
  if (!tbody) return;

  let list = (listOverride || currentSubmissions.length > 0 ? currentSubmissions : getSubmissions())
    .sort((a, b) => (b.totalScore - a.totalScore) || (a.totalTime - b.totalTime));

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
        <td colspan="10" style="text-align:center; padding:2rem; color:var(--text-muted);">
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
        <td style="color:var(--text-muted); font-size:0.84rem;">${escapeHTML(r.contact || '-')}</td>
        <td>${r.cwScore || 0}</td>
        <td>${r.muScore || 0}</td>
        <td>${r.quizScore || 0}</td>
        <td><strong style="color:var(--primary)">${r.totalScore || 0} pts</strong></td>
        <td style="color:var(--text-muted); font-size:0.84rem;">${r.totalTime || 0}s</td>
        <td>
          <button class="btn btn-sm btn-ghost inspect-btn" data-id="${r.id}" title="Inspect submission details" style="padding:0.3rem 0.5rem;">
            <i data-lucide="eye" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-sm btn-ghost delete-btn" data-id="${r.id}" title="Delete this submission" style="padding:0.3rem 0.5rem; color:var(--danger);">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners for inspect and delete buttons
  tbody.querySelectorAll('.inspect-btn').forEach(btn => {
    btn.onclick = () => openInspectModal(btn.dataset.id);
  });

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => handleDeleteSubmission(btn.dataset.id);
  });

  if (window.lucide) window.lucide.createIcons();
}

/* ============ SUBMISSION INSPECTOR MODAL ============ */
function setupInspectorModal() {
  const modal = document.getElementById('inspect-modal');
  const closeBtn = document.getElementById('inspect-modal-close');
  if (closeBtn) {
    closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
  }
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
  }
}

function openInspectModal(id) {
  const allSubs = currentSubmissions.length > 0 ? currentSubmissions : getSubmissions();
  const record = allSubs.find(r => String(r.id) === String(id));
  if (!record) return;

  const modal = document.getElementById('inspect-modal');
  const body = document.getElementById('inspect-modal-body');
  if (!modal || !body) return;

  const fields = [
    ['Submission ID', record.id],
    ['Timestamp', record.timestamp || 'N/A'],
    ['Name', record.name],
    ['Course / Dept', record.course],
    ['Contact', record.contact || 'Not provided'],
    ['Crossword Score', `${record.cwScore || 0} pts`],
    ['Match-Up Score', `${record.muScore || 0} pts`],
    ['Quiz Score', `${record.quizScore || 0} pts`],
    ['Total Score', `${record.totalScore || 0} pts`],
    ['Total Time', `${record.totalTime || 0}s`]
  ];

  body.innerHTML = `
    <div style="display:grid; gap:0.75rem;">
      ${fields.map(([label, value]) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-subtle);">
          <span style="color:var(--text-muted); font-weight:600; font-size:0.88rem;">${label}</span>
          <span style="font-weight:700; color:var(--text-main); font-size:0.92rem;">${escapeHTML(String(value))}</span>
        </div>
      `).join('')}
    </div>
  `;

  modal.style.display = 'flex';
}

async function handleDeleteSubmission(id) {
  if (!confirm('Delete this submission permanently? This action cannot be undone.')) return;

  await deleteCloudSubmission(id);

  // Refresh the display
  const list = getSubmissions();
  currentSubmissions = list;
  renderAllAdminData(list);
}

/* ============ QR CODE ============ */
export function updateAdminQRCode() {
  const qrInput = document.getElementById('admin-qr-url');
  const qrImg = document.getElementById('admin-qr-img');
  if (!qrImg) return;

  const url = (qrInput && qrInput.value.trim()) || window.location.href.split('admin.html')[0].split('#')[0];
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  qrImg.src = qrApi;
}

/* ============ CSV EXPORT ============ */
export function exportLeaderboardCSV() {
  const list = (currentSubmissions.length > 0 ? currentSubmissions : getSubmissions())
    .sort((a, b) => (b.totalScore - a.totalScore) || (a.totalTime - b.totalTime));

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

/* ============ DATA MANAGEMENT ============ */
function handleClearData() {
  if (confirm('Are you sure you want to delete all stored submissions from this device? This action cannot be undone.')) {
    clearSubmissions();
    currentSubmissions = [];
    renderAllAdminData([]);
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
      const imported = data.map((r, idx) => {
        if (typeof r === 'object' && !Array.isArray(r) && r.name) {
          return {
            id: String(r.id || idx),
            timestamp: r.timestamp || '',
            name: r.name,
            course: r.course || '',
            contact: r.contact || '',
            cwScore: Number(r.cwScore) || 0,
            muScore: Number(r.muScore) || 0,
            quizScore: Number(r.quizScore) || 0,
            totalScore: Number(r.totalScore) || 0,
            totalTime: Number(r.totalTime) || 0
          };
        }
        return {
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
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      currentSubmissions = imported;
      renderAllAdminData(imported);
      alert(`Connected and imported ${imported.length} submissions from Google Sheets!`);
    } else {
      alert('Webhook saved! New submissions will automatically push to your Google Sheet.');
    }
  } catch (err) {
    alert('Webhook URL saved! Submissions will post to your Google Sheet.');
  }

  // Activate real-time cloud sync
  startRealtimeSubscription();
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
