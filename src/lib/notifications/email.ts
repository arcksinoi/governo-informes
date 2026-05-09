import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

interface EmailNotification {
  titulo: string;
  resumo: string;
  conteudo: string;
  fonteUrl: string;
  informeNumero: string;
  siteUrl: string;
}

/**
 * Sends email notification when a high-relevance informe is detected.
 */
export async function sendInformeNotification(
  data: EmailNotification
): Promise<void> {
  const recipients = (process.env.NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.warn("No notification emails configured. Skipping email send.");
    return;
  }

  const html = generateEmailHtml(data);

  await transporter.sendMail({
    from: `"Compadre do CadÚnico" <${process.env.EMAIL_SMTP_USER}>`,
    to: recipients.join(", "),
    subject: `Novo informe importante do CadÚnico - ${data.titulo}`,
    html,
  });

  console.log(
    `Email notification sent to ${recipients.length} recipients for ${data.informeNumero}`
  );
}

function generateEmailHtml(data: EmailNotification): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a4e 100%); color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header .badge { display: inline-block; background: #ff6b35; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .content { padding: 32px; }
    .titulo { font-size: 22px; color: #1a1a1a; margin-bottom: 12px; font-weight: 700; }
    .resumo { font-size: 16px; color: #555; margin-bottom: 20px; padding: 16px; background: #f0f7f0; border-left: 4px solid #2d8a4e; border-radius: 4px; }
    .texto { font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 24px; white-space: pre-line; }
    .cta { display: inline-block; background: #2d8a4e; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 16px; }
    .fonte { font-size: 13px; color: #777; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
    .footer { background: #f9f9f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #2d8a4e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Compadre do CadUnico</h1>
      <div class="badge">INFORME IMPORTANTE</div>
    </div>
    <div class="content">
      <div class="titulo">${escapeHtml(data.titulo)}</div>
      <div class="resumo">${escapeHtml(data.resumo)}</div>
      <div class="texto">${escapeHtml(data.conteudo)}</div>
      <a href="${data.siteUrl}" class="cta">Ler mais no site</a>
      <div class="fonte">
        <strong>Fonte oficial:</strong>
        <a href="${escapeHtml(data.fonteUrl)}" style="color: #2d8a4e;">${escapeHtml(data.informeNumero)} - gov.br/mds</a>
      </div>
    </div>
    <div class="footer">
      <p>Compadre do CadUnico - Informacao simplificada para o povo</p>
      <p>As informacoes sao extraidas diretamente do site do MDS (gov.br)</p>
      <p><a href="${data.siteUrl}">Visite nosso site</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
