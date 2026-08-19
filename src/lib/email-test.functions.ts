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
  const logoUrl = `${appUrl}/icon-512.png`;
  const watermarkUrl = `${appUrl}/email-watermark.png`;

  const html = `
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
                            <a href="${appUrl}" style="display:inline-block;padding:15px 34px;color:#FFFFFF;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:15px;line-height:1;font-weight:800;letter-spacing:0.2px;">CRIAR MEU ACESSO</a>
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
                    <div style="font-size:16px;font-weight:800;color:#6339ff;margin-bottom:4px;">Oitava Music Betim</div>
                    <div style="font-size:12px;line-height:1.6;color:#6B7280;">Aplicativo do ministério de louvor</div>
                  </td>
                </tr>
              </table>
              <div style="padding:14px 12px 0;text-align:center;font-size:10px;line-height:1.6;color:#9CA3AF;">E-mail de visualização do convite · Oitava Music Betim</div>
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
      subject: 'Crie seu acesso ao Oitava Music Betim',
      html,
      text: 'Olá! Você recebeu este e-mail para criar seu acesso ao Oitava Music Betim, o aplicativo utilizado para organizar as informações do ministério de louvor. Este link é pessoal e intransferível e deve ser utilizado com o mesmo e-mail que recebeu a mensagem.',
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result?.message || result?.error || `HTTP ${response.status}`;
    throw new Error(`Resend recusou o envio: ${detail}`);
  }

  return { success: true, id: result?.id || '', to };
});
