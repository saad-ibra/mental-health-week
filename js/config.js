/* ===================================================================
   CENTRAL CLOUD DATABASE CONFIGURATION — MENTAL HEALTH WEEK
   Bake your Google Sheets Web App URL or Firebase credentials here
   so that EVERY smartphone scanning the QR code connects automatically.
   =================================================================== */

export const CLOUD_CONFIG = {
  // Google Apps Script Web App URL (Primary Central Database)
  // Format: "https://script.google.com/macros/s/AKfycb.../exec"
  googleSheetWebhookUrl: "https://script.google.com/macros/s/AKfycbw-IgJ8JfZWYbjWrLOnTTcjmg9Wpu4PXULps1W33lWUKjKTIn8nWfViXjGlj7vdUa1L/exec",

  // Optional: Firebase Firestore config
  firebaseConfig: null
};

export function getCentralWebhookUrl() {
  // 1. Check baked-in config first (works for ALL attendee smartphones across the web)
  if (CLOUD_CONFIG.googleSheetWebhookUrl && CLOUD_CONFIG.googleSheetWebhookUrl.trim()) {
    return CLOUD_CONFIG.googleSheetWebhookUrl.trim();
  }
  // 2. Fall back to local storage (if organizer configured via admin UI)
  try {
    return localStorage.getItem('mhw_webhook_url') || '';
  } catch (e) {
    return '';
  }
}

export function getCentralFirebaseConfig() {
  // 1. Check baked-in config first
  if (CLOUD_CONFIG.firebaseConfig && CLOUD_CONFIG.firebaseConfig.apiKey) {
    return CLOUD_CONFIG.firebaseConfig;
  }
  // 2. Fall back to local storage
  try {
    const raw = localStorage.getItem('mhw_firebase_config');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
