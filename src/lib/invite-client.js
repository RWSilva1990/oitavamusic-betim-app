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

function shouldUseFirebaseFallback(message) {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('google recusou a renovação do token do gmail')
    || normalized.includes('invalid_grant')
    || normalized.includes('token has been expired or revoked')
    || normalized.includes('you can only send testing emails to your own email address')
    || normalized.includes('please verify a domain')
    || normalized.includes('resend.com/domains');
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

    // O Resend exige um domínio verificado para destinatários externos. Enquanto
    // o domínio de envio não estiver configurado, o Firebase Authentication é o
    // transporte oficial de contingência. O link, o fluxo de cadastro e a URL de
    // retorno continuam sendo os mesmos no APK, PWA e web.
    if (shouldUseFirebaseFallback(message)) {
      try {
        await sendFirebaseInvitationFallback(auth, mod, clean);
      } catch (fallbackError) {
        const fallbackMessage = String(fallbackError?.message || fallbackError || '');
        throw new Error(`Não foi possível enviar o convite pelo serviço de e-mail nem pelo Firebase: ${fallbackMessage}`);
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
