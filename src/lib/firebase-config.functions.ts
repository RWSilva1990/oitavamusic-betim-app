import { createServerFn } from '@tanstack/react-start';

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

function vercelAppUrl() {
  const vercelEnv = env('VERCEL_ENV');
  const branchUrl = env('VERCEL_BRANCH_URL');
  const productionUrl = env('VERCEL_PROJECT_PRODUCTION_URL');

  if (vercelEnv === 'preview' && branchUrl) return `https://${branchUrl}`;
  if (productionUrl) return `https://${productionUrl}`;
  return '';
}

export const getFirebaseConfig = createServerFn({ method: 'GET' }).handler(async () => {
  const apiKey = env('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY', 'GOOGLE_API_KEY');
  const appId = env('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID');
  const projectId = env('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID') || 'oitavamusicbetim';
  const authDomain = env('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`;
  const storageBucket =
    env('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET') || `${projectId}.firebasestorage.app`;
  const messagingSenderId = env(
    'FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  );
  const vapidKey = env('FIREBASE_VAPID_KEY', 'VITE_FIREBASE_VAPID_KEY');
  const adminEmails = env('ADMIN_EMAILS', 'VITE_ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const appUrl = (env('APP_URL', 'VITE_APP_URL') || vercelAppUrl()).replace(/\/$/, '');

  return {
    apiKey,
    appId,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    vapidKey,
    adminEmails,
    appUrl,
    configured: Boolean(apiKey && appId && projectId),
    messagingConfigured: Boolean(apiKey && appId && projectId && messagingSenderId && vapidKey),
  };
});
