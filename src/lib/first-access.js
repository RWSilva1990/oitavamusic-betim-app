import { getFirebaseAuth, loadFirebaseConfig } from './firebase';

const INVITE_EMAIL_KEY = 'oitava:invite-email';

export async function requestFirstAccessLink(mail) {
  const clean = String(mail || '').trim().toLowerCase();
  if (!clean) throw new Error('Informe seu e-mail para receber o link.');

  const { auth, mod } = await getFirebaseAuth();
  auth.languageCode = 'pt-BR';
  const cfg = await loadFirebaseConfig();
  const origin = (cfg.appUrl || window.location.origin).replace(/\/$/, '');
  const continueUrl = `${origin}/convite`;

  try {
    await mod.sendSignInLinkToEmail(auth, clean, {
      url: continueUrl,
      handleCodeInApp: true,
    });
    window.localStorage.setItem(INVITE_EMAIL_KEY, clean);
    return { email: clean, continueUrl };
  } catch (error) {
    if (error?.code === 'auth/unauthorized-continue-uri') {
      throw new Error(`Firebase recusou o domínio de retorno. URL usada: ${continueUrl}`);
    }
    throw error;
  }
}
