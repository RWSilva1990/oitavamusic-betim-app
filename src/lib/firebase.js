import { getFirebaseConfig } from './firebase-config.functions';

let configPromise = null;

export function loadFirebaseConfig() {
  if (!configPromise) {
    configPromise = getFirebaseConfig().catch(() => ({
      configured: false,
      adminEmails: [],
      appUrl: '',
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
      const { adminEmails, configured, appUrl, ...options } = cfg;
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
