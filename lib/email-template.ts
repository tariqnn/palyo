const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export function buildPasswordResetEmail(url: string) {
  const safeUrl = escapeHtml(url);
  const text = `Use this secure link to reset your PlayUp password. This link expires in one hour.\n\n${url}\n\nIf you did not ask to reset your password, you can ignore this email.`;
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#17221c">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Reset your PlayUp password using your secure one-time link.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e2eae5;border-radius:16px">
          <tr><td style="padding:32px 32px 12px">
            <p style="margin:0 0 22px;color:#13833f;font-size:16px;font-weight:700;letter-spacing:.2px">PLAYUP</p>
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3">Reset your password</h1>
            <p style="margin:0 0 24px;color:#526158;font-size:16px;line-height:1.6">We received a request to reset the password for your PlayUp account. Use the button below to choose a new password.</p>
            <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;border-radius:9px;background:#168447;color:#fff;padding:13px 20px;font-size:15px;font-weight:700;text-decoration:none">Reset password</a></p>
            <p style="margin:0 0 8px;color:#526158;font-size:14px;line-height:1.6">This secure link expires in one hour.</p>
            <p style="margin:0 0 8px;color:#526158;font-size:14px;line-height:1.6">If the button does not work, copy this link into your browser:</p>
            <p style="margin:0 0 24px;overflow-wrap:anywhere;font-size:13px;line-height:1.6"><a href="${safeUrl}" style="color:#126a38">${safeUrl}</a></p>
            <p style="margin:0 0 20px;color:#526158;font-size:14px;line-height:1.6">If you did not request a password reset, you can ignore this email. Your password will not change.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e8eee9;padding:16px 32px;color:#748078;font-size:12px;line-height:1.5">PlayUp account security · This is an automated transactional email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { text, html };
}
