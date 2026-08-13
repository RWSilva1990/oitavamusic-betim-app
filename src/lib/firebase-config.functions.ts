import { createServerFn } from '@tanstack/react-start';

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

export const getFirebaseConfig = createServerFn({ method: 'GET' }).handler(async () => {
  // Accept both the names Lovable originally requested and server-only names
  // that are more appropriate on Vercel. Firebase Web config values are public,
  // but keeping one source of truth on the server avoids baking environment
  // differences into the client bundle.
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
  const adminEmails = env('ADMIN_EMAILS', 'VITE_ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const appUrl = env('APP_URL', 'VITE_APP_URL').replace(/\/$/, '');

  return {
    apiKey,
    appId,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    adminEmails,
    appUrl,
    configured: Boolean(apiKey && appId && projectId),
  };
});
