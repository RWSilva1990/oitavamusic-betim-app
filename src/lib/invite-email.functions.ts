import { createServerFn } from '@tanstack/react-start';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  idToken: z.string().min(20),
});

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function adminEmails() {
  return env('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === 'oitava-email');
  if (existing) return existing;

  const raw = env('FIREBASE_ADMIN_SERVICE_ACCOUNT');
  if (!raw) {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não está configurada na Vercel.');
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT não contém um JSON válido.');
  }

  const projectId = serviceAccount.project_id || serviceAccount.projectId || env('FIREBASE_PROJECT_ID');
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = (serviceAccount.private_key || serviceAccount.privateKey || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('A credencial do Firebase Admin está incompleta.');
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    },
    'oitava-email',
  );
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function assertAdmin(idToken: string) {
  const app = getFirebaseAdminApp();
  const auth = getAuth(app);
  const decoded = await auth.verifyIdToken(idToken, true);
  const callerEmail = decoded.email?.trim().toLowerCase();

  if (!callerEmail) throw new Error('Não foi possível identificar o administrador autenticado.');
  if (!adminEmails().includes(callerEmail)) {
    throw new Error('Apenas administradores autorizados podem enviar convites.');
  }

  return { auth, callerEmail };
}

function invitationHtml(appUrl: string, inviteLink: string) {
  const logoUrl = `${appUrl}/icon-512.png`;
  const watermarkUrl = `${appUrl}/email-watermark.png`;
  const safeInviteLink = escapeAttribute(inviteLink);

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @media only screen and (max-width: 520px) {
            .email-shell { padding: 18px 8px !important; }
            .email-card { border-radius: 18px !important; }
            .content-pad { padding-left: 20px !important; padding-right: 20px !important; background-size: 100% auto !important; }
            .headline { font-size: 28px !important; line-height: 1.12 !important; }
            .brand-name { font-size: 21px !important; }
            .feature-label { font-size: 10px !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#F0F2F8;color:#111827;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F0F2F8;">
          <tr>
            <td class="email-shell" align="center" style="padding:28px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-card" style="width:100%;max-width:620px;background:#FFFFFF;border:1px solid #D8DCF0;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(17,24,39,0.08);">
                <tr>
                  <td style="padding:34px 26px 18px;text-align:center;">
                    <img src="${logoUrl}" width="104" height="104" alt="Logo Oitava Music Betim" style="display:block;width:104px;height:104px;margin:0 auto 14px;border-radius:50%;object-fit:cover;" />
                    <div class="brand-name" style="font-size:24px;line-height:1.25;font-weight:800;color:#6339ff;letter-spacing:-0.5px;">Oitava Music Betim</div>
                  </td>
                </tr>
                <tr>
                  <td
                    class="content-pad"
                    background="${watermarkUrl}"
                    style="padding:22px 42px 36px;background-color:#FFFFFF;background-image:url('${watermarkUrl}');background-repeat:no-repeat;background-position:center top;background-size:620px auto;"
                  >
                    <div>
                      <div class="headline" style="margin:0 auto 22px;max-width:510px;text-align:center;font-size:36px;line-height:1.08;font-weight:800;letter-spacing:-1.2px;color:#111827;">
                        Crie seu acesso ao<br />aplicativo do ministério
                      </div>

                      <p style="margin:0 auto 26px;max-width:500px;text-align:center;font-size:15px;line-height:1.75;color:#4B5563;">
                        Olá! Você recebeu este e-mail para criar seu acesso ao <strong style="color:#6339ff;">Oitava Music Betim</strong>, o aplicativo utilizado para organizar as informações do ministério de louvor.
                      </p>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 28px;background:#F8F7FF;border:1px solid #E8E2FF;border-radius:16px;">
                        <tr>
                          <td width="25%" align="center" valign="top" style="padding:18px 6px;border-right:1px solid #E5E7EB;">
                            <div style="font-size:23px;line-height:1;margin-bottom:9px;">📅</div>
                            <div class="feature-label" style="font-size:11px;line-height:1.45;font-weight:700;color:#111827;">Acompanhe<br />suas escalas</div>
                          </td>
                          <td width="25%" align="center" valign="top" style="padding:18px 6px;border-right:1px solid #E5E7EB;">
                            <div style="font-size:23px;line-height:1;margin-bottom:9px;">🎵</div>
                            <div class="feature-label" style="font-size:11px;line-height:1.45;font-weight:700;color:#111827;">Acesse<br />repertórios</div>
                          </td>
                          <td width="25%" align="center" valign="top" style="padding:18px 6px;border-right:1px solid #E5E7EB;">
                            <div style="font-size:23px;line-height:1;margin-bottom:9px;">🎚️</div>
                            <div class="feature-label" style="font-size:11px;line-height:1.45;font-weight:700;color:#111827;">Veja tons,<br />BPMs e áudios</div>
                          </td>
                          <td width="25%" align="center" valign="top" style="padding:18px 6px;">
                            <div style="font-size:23px;line-height:1;margin-bottom:9px;">👥</div>
                            <div class="feature-label" style="font-size:11px;line-height:1.45;font-weight:700;color:#111827;">Consulte informações<br />da equipe</div>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 26px;">
                        <tr>
                          <td align="center" style="border-radius:12px;background:#6339ff;background-image:linear-gradient(135deg,#6339ff,#8b5cf6);box-shadow:0 8px 20px rgba(99,57,255,0.24);">
                            <a href="${safeInviteLink}" style="display:inline-block;padding:15px 34px;color:#FFFFFF;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:15px;line-height:1;font-weight:800;letter-spacing:0.2px;">CRIAR MEU ACESSO</a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F8F7FF;border:1px solid #E8E2FF;border-radius:14px;">
                        <tr>
                          <td width="48" align="center" valign="middle" style="padding:16px 0 16px 16px;font-size:23px;color:#6339ff;">🔒</td>
                          <td style="padding:15px 16px 15px 10px;font-size:12px;line-height:1.6;color:#6B7280;">
                            <strong style="display:block;color:#111827;font-size:13px;">Este link é pessoal e intransferível.</strong>
                            Utilize o mesmo e-mail em que você recebeu esta mensagem.
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px 26px;border-top:1px solid #E8EBF4;text-align:center;background:#FCFCFE;">
                    <div style="font-size:16px;font-weight:800;color:#6339ff;margin-bottom:5px;">Oitava Betim</div>
                    <div style="max-width:500px;margin:0 auto;font-size:12px;line-height:1.65;color:#6B7280;">Uma igreja bíblica, contemporânea, acolhedora de pessoas, presente na cidade e parceira na evangelização do mundo</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function gmailCredentials() {
  const clientId = env('GMAIL_CLIENT_ID');
  const clientSecret = env('GMAIL_CLIENT_SECRET');
  const refreshToken = env('GMAIL_REFRESH_TOKEN');
  const senderEmail = env('GMAIL_SENDER_EMAIL').toLowerCase();

  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    throw new Error('As credenciais do Gmail não estão completas na Vercel.');
  }

  return { clientId, clientSecret, refreshToken, senderEmail };
}

async function getGmailAccessToken() {
  const { clientId, clientSecret, refreshToken } = gmailCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.access_token) {
    const detail = result?.error_description || result?.error || `HTTP ${response.status}`;
    throw new Error(`Google recusou a renovação do token do Gmail: ${detail}`);
  }

  return String(result.access_token);
}

function buildRawEmail({
  from,
  to,
  subject,
  text,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const boundary = `oitava_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  const lines = [
    `From: Oitava Music Betim <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
  ];

  return toBase64Url(lines.join('\r\n'));
}

async function sendThroughGmail(to: string, subject: string, text: string, html: string) {
  const { senderEmail } = gmailCredentials();
  const accessToken = await getGmailAccessToken();
  const raw = buildRawEmail({ from: senderEmail, to, subject, text, html });

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result?.error?.message || result?.error_description || result?.error || `HTTP ${response.status}`;
    throw new Error(`Gmail recusou o envio: ${detail}`);
  }

  return result;
}

export const sendInvitationEmail = createServerFn({ method: 'POST' })
  .validator(inviteSchema)
  .handler(async ({ data }) => {
    const { auth } = await assertAdmin(data.idToken);
    const appUrl = (env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '');
    const inviteLink = await auth.generateSignInWithEmailLink(data.email, {
      url: `${appUrl}/convite`,
      handleCodeInApp: true,
    });

    const subject = 'Crie seu acesso ao Oitava Music Betim';
    const text = `Olá! Você recebeu este e-mail para criar seu acesso ao Oitava Music Betim. Crie seu acesso usando este link pessoal: ${inviteLink}`;
    const html = invitationHtml(appUrl, inviteLink);
    const result = await sendThroughGmail(data.email, subject, text, html);

    return { success: true, id: result?.id || '' };
  });
