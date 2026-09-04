import { dbGet, dbSet } from './db';
import { getFirebaseAuth, loadFirebaseConfig } from './firebase';
import { sendInvitationEmail } from './invite-email.functions';
import { isPackagedNativeApp, sendMobileInvitation } from './mobile-api';

async function sendFirebaseInvitationFallback(auth, mod, clean) {
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
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente como administrador.');

  const idToken = await currentUser.getIdToken();
  try {
    if (isPackagedNativeApp()) await sendMobileInvitation(idToken, clean);
    else await sendInvitationEmail({ data: { email: clean, idToken } });
  } catch (error) {
    const message = String(error?.message || error || '');
    const gmailCredentialFailure =
      message.includes('Google recusou a renovação do token do Gmail')
      || message.includes('invalid_grant')
      || message.includes('Token has been expired or revoked');

    if (gmailCredentialFailure) {
      try {
        await sendFirebaseInvitationFallback(auth, mod, clean);
      } catch (fallbackError) {
        const fallbackMessage = String(fallbackError?.message || fallbackError || '');
        throw new Error(`O Gmail do aplicativo precisa ser reautorizado e o envio alternativo também falhou: ${fallbackMessage}`);
      }
    } else if (message.includes('<!doctype html') || message.includes('<html')) {
      throw new Error('Não foi possível concluir o envio do convite. Tente novamente em instantes.');
    } else {
      throw error;
    }
  }

  const users = (await dbGet('users')) || {};
  if (!users[clean]) users[clean] = { role: 'membro' };
  await dbSet('users', users);
}
