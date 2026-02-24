import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
}

export async function sendBetaCodeEmail(to: string, name: string | null, betaCode: string): Promise<void> {
  const displayName = name || "Kamu";
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"KataViral" <${process.env.BREVO_SMTP_LOGIN}>`,
    to,
    subject: "Selamat! Kode Beta Akses KataViral Kamu Sudah Siap",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF8E7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8E7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:3px solid #000000;border-radius:12px;box-shadow:6px 6px 0px #000000;">
          <tr>
            <td style="background-color:#FFE066;padding:30px 40px;border-bottom:3px solid #000;border-radius:9px 9px 0 0;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#000;">KataViral</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#000;">
                Hai ${displayName}!
              </h2>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333;">
                Selamat! Pendaftaran waitlist kamu sudah di-approve. Kamu sekarang bisa masuk ke KataViral menggunakan kode beta akses di bawah ini:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="display:inline-block;background-color:#FFE066;border:3px solid #000;border-radius:8px;padding:16px 32px;box-shadow:4px 4px 0px #000;">
                      <span style="font-size:32px;font-weight:800;letter-spacing:4px;color:#000;font-family:monospace;">
                        ${betaCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#333;">
                Cara pakai:
              </p>
              <ol style="margin:8px 0 20px;padding-left:20px;font-size:15px;line-height:1.8;color:#333;">
                <li>Buka website KataViral</li>
                <li>Klik tombol <strong>"Masuk"</strong></li>
                <li>Daftar akun baru</li>
                <li>Masukkan kode beta akses di atas saat diminta</li>
              </ol>
              <p style="margin:0;font-size:14px;color:#666;">
                Kode ini hanya berlaku untuk satu kali penggunaan. Jangan bagikan ke orang lain ya!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f5;padding:20px 40px;border-top:2px solid #eee;border-radius:0 0 9px 9px;">
              <p style="margin:0;font-size:13px;color:#999;text-align:center;">
                &copy; KataViral — Quote Indonesia yang Bikin Viral
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
