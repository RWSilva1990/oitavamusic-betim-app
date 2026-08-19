import { dbGet, dbSet } from './db';
import { getFirebaseAuth } from './firebase';
import { sendInvitationEmail } from './invite-email.functions';

export async function sendCustomInvitation(mail) {
  const clean = String(mail || '').trim().toLowerCase();
  if (!clean) throw new Error('Informe o e-mail da pessoa que será convidada.');

  const { auth } = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sua sessão expirou. Entre novamente como administrador.');

  const idToken = await currentUser.getIdToken();
  try {
    await sendInvitationEmail({ data: { email: clean, idToken } });
  } catch (error) {
    const message = String(error?.message || error || '');
    if (message.includes('<!doctype html') || message.includes('<html')) {
      throw new Error('Não foi possível concluir o envio do convite. Tente novamente em instantes.');
    }
    throw error;
  }

  const users = (await dbGet('users')) || {};
  if (!users[clean]) users[clean] = { role: 'membro' };
  await dbSet('users', users);
}
