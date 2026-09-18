import { dbGet, dbSet } from './db';
import { getFirebaseAuth, loadFirebaseConfig } from './firebase';

async function sendFirebaseInvitation(auth, mod, clean) {
  const cfg = await loadFirebaseConfig();
  const origin = (cfg.appUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  if (!origin) throw new Error('Não foi possível identificar a URL de retorno do convite.');

  auth.languageCode = 'pt-BR';
  await mod.sendSignInLinkToEmail(auth, clean, {
    url: `${origin}/convite`,
    handleCodeInApp: true,
  });
}

export async function sendCustomInvitation(mail) {
  const clean = String(mail || '').trim().toLowerCase();
  if (!clean) throw new Error('Informe o e-mail da pessoa que será convidada.');

  const { auth, mod } = await getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Sua sessão expirou. Entre novamente como administrador.');

  try {
    await sendFirebaseInvitation(auth, mod, clean);
  } catch (error) {
    const message = String(error?.message || error || '');
    throw new Error(`Não foi possível enviar o convite pelo Firebase Authentication: ${message}`);
  }

  const users = (await dbGet('users')) || {};
  if (!users[clean]) users[clean] = { role: 'membro' };
  await dbSet('users', users);
}
