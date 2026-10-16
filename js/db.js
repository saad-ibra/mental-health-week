/* ===================================================================
   UNIVERSAL CLOUD DATABASE ADAPTER — MENTAL HEALTH WEEK
   Google Sheets Webhook (Live Cloud DB) + Firebase Firestore + Local Cache
   =================================================================== */

import { STORAGE_KEY, WEBHOOK_KEY, getSubmissions } from './state.js';
import { getCentralWebhookUrl, getCentralFirebaseConfig } from './config.js';

export const FIREBASE_CONFIG_KEY = 'mhw_firebase_config';
const SUBMISSIONS_COLLECTION = 'mhw_submissions';

let dbInstance = null;
let firestoreUnsubscribe = null;
let webhookPollingTimer = null;
let isInitialized = false;

export function getEffectiveWebhookUrl() {
  return getCentralWebhookUrl();
}

export function getFirebaseConfig() {
  return getCentralFirebaseConfig();
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
  initCloudDB();
}

/**
 * Initializes Firebase Firestore if credentials exist
 */
export function initCloudDB() {
  if (typeof window === 'undefined') return null;

  const config = getFirebaseConfig();
  if (config && config.apiKey && config.projectId && window.firebase) {
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(config);
      }
      dbInstance = window.firebase.firestore();
      isInitialized = true;
      console.log('Firebase Firestore initialized successfully.');
      return dbInstance;
    } catch (err) {
      console.warn('Firebase init error:', err);
      dbInstance = null;
      isInitialized = false;
    }
  }
  return null;
}

/**
 * Fetches latest submissions from Google Sheets Webhook GET endpoint
 */
export async function fetchSubmissionsFromWebhook(url) {
  if (!url) url = getEffectiveWebhookUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    if (Array.isArray(data)) {
      const formatted = data.map((r, idx) => {
        if (typeof r === 'object' && !Array.isArray(r) && r.name) {
          return {
            id: String(r.id || idx),
            timestamp: r.timestamp || '',
            name: String(r.name || 'Anonymous'),
            course: String(r.course || ''),
            contact: String(r.contact || ''),
            cwScore: Number(r.cwScore) || 0,
            muScore: Number(r.muScore) || 0,
            quizScore: Number(r.quizScore) || 0,
            totalScore: Number(r.totalScore) || 0,
            totalTime: Number(r.totalTime) || 0
          };
        } else if (Array.isArray(r) && r.length >= 8) {
          return {
            id: String(r[0] || idx),
            timestamp: String(r[1] || ''),
            name: String(r[2] || 'Anonymous'),
            course: String(r[3] || ''),
            contact: String(r[4] || ''),
            cwScore: Number(r[5]) || 0,
            muScore: Number(r[6]) || 0,
            quizScore: Number(r[7]) || 0,
            totalScore: Number(r[8]) || 0,
            totalTime: Number(r[9]) || 0
          };
        }
        return null;
      }).filter(Boolean);

      if (formatted.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Cloud webhook fetch notice:', err);
  }
  return null;
}

/**
 * Saves a participant submission to all available destinations:
 * 1. Google Sheets Webhook (Central Online Database)
 * 2. Firebase Firestore (if configured)
 * 3. LocalStorage (Offline Resilience Cache)
 */
export async function saveCloudSubmission(record) {
  const result = {
    cloudSaved: false,
    webhookSaved: false,
    localSaved: false,
    id: record.id || Date.now().toString()
  };

  record.id = String(record.id || Date.now());

  // 1. Save to Local Cache first
  try {
    const localList = getSubmissions();
    const existingIdx = localList.findIndex(r => String(r.id) === String(record.id));
    if (existingIdx >= 0) {
      localList[existingIdx] = record;
    } else {
      localList.push(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));
    result.localSaved = true;
  } catch (err) {
    console.warn('Local cache save warning:', err);
  }

  // 2. Save to Google Sheets Webhook (Primary Central Cloud Database)
  const webhookUrl = getEffectiveWebhookUrl();
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      result.webhookSaved = true;
      result.cloudSaved = true;
      console.log('Submission posted to central Google Sheets cloud database.');
    } catch (err) {
      console.warn('Google Sheets cloud post notice:', err);
    }
  }

  // 3. Save to Firebase Firestore if initialized
  if (!dbInstance) {
    initCloudDB();
  }

  if (dbInstance) {
    try {
      await dbInstance.collection(SUBMISSIONS_COLLECTION).doc(record.id).set({
        ...record,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
      result.cloudSaved = true;
      console.log('Submission saved to Firebase Firestore.');
    } catch (err) {
      console.warn('Firestore write failed, relying on webhook:', err);
    }
  }

  return result;
}

/**
 * Subscribes to submissions in real time.
 * If Firebase is available, uses onSnapshot for instant WebSocket updates.
 * If Google Sheets Webhook is configured, polls every 8s.
 * Always falls back to local cache.
 */
export function subscribeToSubmissions(callback) {
  if (typeof callback !== 'function') return () => {};

  // Clean up any existing listeners
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }
  if (webhookPollingTimer) {
    clearInterval(webhookPollingTimer);
    webhookPollingTimer = null;
  }

  if (!dbInstance) {
    initCloudDB();
  }

  // 1. Firebase Realtime Listener
  if (dbInstance) {
    try {
      firestoreUnsubscribe = dbInstance
        .collection(SUBMISSIONS_COLLECTION)
        .orderBy('totalScore', 'desc')
        .onSnapshot(
          snapshot => {
            const list = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              list.push({ ...data, id: doc.id });
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            callback(list, 'firebase');
          },
          err => {
            console.warn('Firestore subscription notice, falling back:', err);
            setupWebhookOrLocalFallback(callback);
          }
        );
      return firestoreUnsubscribe;
    } catch (e) {
      console.warn('Could not establish Firestore listener:', e);
    }
  }

  // 2. Setup Webhook Polling or Local Fallback
  return setupWebhookOrLocalFallback(callback);
}

function setupWebhookOrLocalFallback(callback) {
  const webhookUrl = getEffectiveWebhookUrl();

  if (webhookUrl) {
    // Immediate callback with whatever we have cached
    callback(getSubmissions(), 'webhook');

    // Fetch immediately from cloud
    fetchSubmissionsFromWebhook(webhookUrl).then(rows => {
      if (rows && rows.length > 0) {
        callback(rows, 'webhook');
      }
    });

    // Start background cloud sync every 8 seconds
    webhookPollingTimer = setInterval(async () => {
      const rows = await fetchSubmissionsFromWebhook(webhookUrl);
      if (rows && rows.length > 0) {
        callback(rows, 'webhook');
      }
    }, 8000);
  } else {
    // Local cache only
    callback(getSubmissions(), 'local');
  }

  // Also setup a storage event listener for cross-tab sync
  const storageListener = e => {
    if (e.key === STORAGE_KEY) {
      callback(getSubmissions(), webhookUrl ? 'webhook' : 'local');
    }
  };
  window.addEventListener('storage', storageListener);

  return () => {
    window.removeEventListener('storage', storageListener);
    if (webhookPollingTimer) {
      clearInterval(webhookPollingTimer);
      webhookPollingTimer = null;
    }
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
  };
}

/**
 * Deletes a submission by ID from Firestore and Local Cache
 */
export async function deleteCloudSubmission(id) {
  id = String(id);

  // Remove from local cache
  try {
    const list = getSubmissions().filter(r => String(r.id) !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local delete warning:', e);
  }

  // Remove from Firestore
  if (!dbInstance) initCloudDB();
  if (dbInstance) {
    try {
      await dbInstance.collection(SUBMISSIONS_COLLECTION).doc(id).delete();
      return true;
    } catch (err) {
      console.error('Firestore delete failed:', err);
      return false;
    }
  }
  return true;
}

/**
 * Test the database connection
 */
export async function testDatabaseConnection(config) {
  if (!config || !config.apiKey || !config.projectId) {
    return { success: false, message: 'Missing API Key or Project ID.' };
  }

  if (!window.firebase) {
    return { success: false, message: 'Firebase library not loaded in browser.' };
  }

  try {
    const tempApp = window.firebase.initializeApp(config, 'test-app-' + Date.now());
    const tempDb = tempApp.firestore();
    const probeDoc = tempDb.collection('_health_check').doc('probe');
    await probeDoc.set({ timestamp: Date.now() });
    await probeDoc.delete();
    await tempApp.delete();
    return { success: true, message: 'Connection successful! Cloud database is online and writable.' };
  } catch (err) {
    return { success: false, message: 'Connection failed: ' + (err.message || err) };
  }
}
