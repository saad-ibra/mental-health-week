/* ===================================================================
   UNIVERSAL CLOUD DATABASE ADAPTER — MENTAL HEALTH WEEK
   Firebase Firestore Realtime Sync + Google Sheets Webhook + Local Cache
   =================================================================== */

import { STORAGE_KEY, WEBHOOK_KEY, getSubmissions } from './state.js';

export const FIREBASE_CONFIG_KEY = 'mhw_firebase_config';
const SUBMISSIONS_COLLECTION = 'mhw_submissions';

let dbInstance = null;
let firestoreUnsubscribe = null;
let isInitialized = false;

// Default Firebase configuration placeholder if organizer configures it
export function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
  // Re-init
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
 * Saves a participant submission to all available destinations:
 * 1. Firebase Firestore (Central Cloud)
 * 2. Google Sheets Webhook (Optional Central Spreadsheet)
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

  // 2. Save to Firebase Firestore if initialized
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
      console.warn('Firestore write failed, will rely on local/webhook:', err);
    }
  }

  // 3. Post to Google Sheets Webhook if configured
  const webhookUrl = localStorage.getItem(WEBHOOK_KEY);
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      result.webhookSaved = true;
    } catch (err) {
      console.warn('Google Sheets webhook post failed:', err);
    }
  }

  return result;
}

/**
 * Subscribes to submissions in real time.
 * If Firebase is available, uses onSnapshot for instant WebSocket updates.
 * Otherwise falls back to localStorage with periodic webhook polling.
 */
export function subscribeToSubmissions(callback) {
  if (typeof callback !== 'function') return () => {};

  if (!dbInstance) {
    initCloudDB();
  }

  // Clean up any existing listener
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
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
            // Update local cache as well
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            callback(list, 'firebase');
          },
          err => {
            console.warn('Firestore subscription error, falling back to local:', err);
            callback(getSubmissions(), 'local');
          }
        );
      return firestoreUnsubscribe;
    } catch (e) {
      console.warn('Could not establish Firestore listener:', e);
    }
  }

  // 2. Fallback: Local Cache
  callback(getSubmissions(), 'local');

  // Also setup a storage event listener for cross-tab sync
  const storageListener = e => {
    if (e.key === STORAGE_KEY) {
      callback(getSubmissions(), 'local');
    }
  };
  window.addEventListener('storage', storageListener);

  return () => {
    window.removeEventListener('storage', storageListener);
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
    // Test write and delete of a probe document
    const probeDoc = tempDb.collection('_health_check').doc('probe');
    await probeDoc.set({ timestamp: Date.now() });
    await probeDoc.delete();
    await tempApp.delete();
    return { success: true, message: 'Connection successful! Cloud database is online and writable.' };
  } catch (err) {
    return { success: false, message: 'Connection failed: ' + (err.message || err) };
  }
}
