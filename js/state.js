/* ===================================================================
   STATE MANAGEMENT & STORAGE — MENTAL HEALTH WEEK
   =================================================================== */

export const STORAGE_KEY = 'mhw_submissions_2026';
export const WEBHOOK_KEY = 'mhw_webhook_url';
export const ADMIN_PASS_KEY = 'mhw_admin_passcode';
export const THEME_KEY = 'mhw_theme_preference';

const DEFAULT_ADMIN_PASS = 'mentalhealth2026';

export function getAdminPasscode() {
  return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASS;
}

export function setAdminPasscode(newPass) {
  if (newPass && newPass.trim()) {
    localStorage.setItem(ADMIN_PASS_KEY, newPass.trim());
    return true;
  }
  return false;
}

let currentUser = null;

let sessionData = {
  // Crossword
  cwScore: 0,
  cwTime: 0,
  cwDone: false,
  cwHints: 0,
  cwRevealed: false,

  // Match-Up
  muScore: 0,
  muTime: 0,
  muDone: false,
  muSlips: 0,

  // Quiz
  quizScore: 0,
  quizTime: 0,
  quizDone: false,
  quizCorrect: 0,
  quizTotal: 8
};

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function getSessionData() {
  return sessionData;
}

export function updateSessionData(patch) {
  sessionData = { ...sessionData, ...patch };
  return sessionData;
}

export function getTotalScore() {
  return (sessionData.cwScore || 0) + (sessionData.muScore || 0) + (sessionData.quizScore || 0);
}

export function getTotalTime() {
  return (sessionData.cwTime || 0) + (sessionData.muTime || 0) + (sessionData.quizTime || 0);
}

export function resetSession() {
  sessionData = {
    cwScore: 0,
    cwTime: 0,
    cwDone: false,
    cwHints: 0,
    cwRevealed: false,
    muScore: 0,
    muTime: 0,
    muDone: false,
    muSlips: 0,
    quizScore: 0,
    quizTime: 0,
    quizDone: false,
    quizCorrect: 0,
    quizTotal: 8
  };
}

export function getSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load submissions from localStorage:', err);
    return [];
  }
}

export function saveSubmission(record) {
  const list = getSubmissions();
  list.push(record);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save submission to localStorage:', err);
  }
  return list;
}

export function clearSubmissions() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getWebhookUrl() {
  return localStorage.getItem(WEBHOOK_KEY) || '';
}

export function setWebhookUrl(url) {
  if (url) {
    localStorage.setItem(WEBHOOK_KEY, url.trim());
  } else {
    localStorage.removeItem(WEBHOOK_KEY);
  }
}

export async function syncWithWebhook(record) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return { success: false, reason: 'no_webhook' };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return { success: true };
  } catch (err) {
    console.warn('Webhook post failed (could be network or CORS):', err);
    return { success: false, error: err };
  }
}
