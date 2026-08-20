import { getFirebaseConfig } from './firebase-config.functions';

let configPromise = null;

export function loadFirebaseConfig() {
  if (!configPromise) {
    configPromise = getFirebaseConfig().catch(() => ({
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

export function firebaseServiceWorkerUrl(cfg) {
  const params = new URLSearchParams();
  const publicKeys = ['apiKey', 'appId', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId'];
  publicKeys.forEach((key) => {
    const value = cfg?.[key];
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/sw.js?${query}` : '/sw.js';
}
