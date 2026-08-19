import { createServerFn } from '@tanstack/react-start';

function env(name: string) {
  return process.env[name]?.trim() || '';
}

function firstAdminEmail() {
  return env('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)[0] || '';
}

export const sendResendTestEmail = createServerFn({ method: 'POST' }).handler(async () => {
  const apiKey = env('RESEND_API_KEY');
  const to = firstAdminEmail();

  if (!apiKey) throw new Error('RESEND_API_KEY não está configurada na Vercel.');
  if (!to) throw new Error('ADMIN_EMAILS não está configurado na Vercel.');

  const appUrl = (env('APP_URL') || 'https://oitavamusicbetim.vercel.app').replace(/\/$/, '');
  const logoUrl = `${appUrl}/pwa-icon-192.png`;

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <body style="margin:0;padding:0;background:#f3f1fb;font-family:Arial,Helvetica,sans-serif;color:#211a3a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f1fb;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7e2f5;box-shadow:0 10px 30px rgba(44,31,86,.08);">
                <tr>
                  <td style="padding:26px 28px;background:#6339ff;text-align:center;">
                    <img src="${logoUrl}" width="64" height="64" alt="Oitava Music" style="display:block;margin:0 auto 12px;border-radius:16px;" />
                    <div style="font-size:22px;line-height:1.2;font-weight:800;color:#ffffff;">Oitava Music Betim</div>
                    <div style="margin-top:6px;font-size:13px;line-height:1.5;color:#e6ddff;">Comunicação do ministério de louvor</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 30px 26px;">
                    <div style="font-size:20px;font-weight:800;margin-bottom:12px;">Seu e-mail está funcionando 🎵</div>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#5f5870;">
                      Este é o primeiro envio de teste do Oitava Music usando o Resend e a infraestrutura da Vercel.
                    </p>
                    <div style="margin:22px 0;padding:16px 18px;background:#f6f3ff;border:1px solid #e6deff;border-radius:12px;font-size:14px;line-height:1.6;color:#4e4568;">
                      Se você recebeu esta mensagem, a integração básica de envio já está funcionando corretamente.
                    </div>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 6px;">
                      <tr>
                        <td style="border-radius:10px;background:#6339ff;">
                          <a href="${appUrl}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">Abrir Oitava Music</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 30px;background:#faf9fd;border-top:1px solid #eeeaf6;text-align:center;font-size:11px;line-height:1.6;color:#8a8299;">
                    Oitava Music Betim · E-mail transacional de teste
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Oitava Music <onboarding@resend.dev>',
      to: [to],
      subject: 'Teste de e-mail — Oitava Music Betim',
      html,
      text: 'Seu e-mail do Oitava Music está funcionando. Este é um envio de teste usando Resend e Vercel.',
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result?.message || result?.error || `HTTP ${response.status}`;
    throw new Error(`Resend recusou o envio: ${detail}`);
  }

  return { success: true, id: result?.id || '', to };
});
