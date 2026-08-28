import { getFirebaseConfig } from './firebase-config.functions';
import { getMobileFirebaseConfig, isPackagedNativeApp } from './mobile-api';

let configPromise = null;

function packagedTestConfig() {
  if (!isPackagedNativeApp() || import.meta.env.VITE_ANDROID_TEST_DIRECT_FIREBASE !== 'true') return null;

  const cfg = {
    apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    appId: String(import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    vapidKey: String(import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim(),
    appUrl: String(import.meta.env.VITE_APP_URL || '').trim(),
    adminEmails: String(import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };

  return {
    ...cfg,
    configured: Boolean(cfg.apiKey && cfg.appId && cfg.authDomain && cfg.projectId),
    messagingConfigured: Boolean(cfg.messagingSenderId && cfg.vapidKey),
  };
}

export function loadFirebaseConfig() {
  if (!configPromise) {
    const testConfig = packagedTestConfig();
    const load = testConfig
      ? Promise.resolve(testConfig)
      : isPackagedNativeApp()
        ? getMobileFirebaseConfig()
        : getFirebaseConfig();

    configPromise = load.catch(() => ({
      configured: false,
      messagingConfigured: false,
      adminEmails: [],
      appUrl: '',
      vapidKey: '',
    }));
  }
  return configPromise;
}

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const cfg = await loadFirebaseConfig();
      if (!cfg.configured) throw new Error('Firebase não configurado');
      const { initializeApp, getApps } = await import('firebase/app');
      const { adminEmails, configured, messagingConfigured, appUrl, vapidKey, ...options } = cfg;
      return getApps().length ? getApps()[0] : initializeApp(options);
    })();
  }
  return appPromise;
}

export async function getFirebaseAuth() {
  const [app, mod] = await Promise.all([getApp(), import('firebase/auth')]);
  return { auth: mod.getAuth(app), mod };
}

export async function getFirebaseFirestore() {
  const [app, mod] = await Promise.all([getApp(), import('firebase/firestore')]);
  return { db: mod.getFirestore(app), mod };
}

export async function getFirebaseStorage() {
  const [app, mod] = await Promise.all([getApp(), import('firebase/storage')]);
  return { storage: mod.getStorage(app), mod };
}

export async function getFirebaseMessaging() {
  const mod = await import('firebase/messaging');
  if (!(await mod.isSupported())) throw new Error('Este aparelho não oferece suporte a notificações push do Firebase.');
  const app = await getApp();
  return { messaging: mod.getMessaging(app), mod };
}

export function firebaseServiceWorkerUrl() {
  return '/sw.js';
}
