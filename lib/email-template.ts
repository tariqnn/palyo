const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export function buildPasswordResetEmail(url: string) {
  const safeUrl = escapeHtml(url);
  const text = `We received a request to reset your PlayUp password. This secure, one-time link expires in one hour.\n\nReset your password: ${url}\n\nIf you did not request a reset, you can ignore this email. Your password will not change.\n\nNeed help? Contact info@creativnetworks.com.\n\nPlayUp Support`;
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif;color:#14221a">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Use your secure one-time link to reset your PlayUp password.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:40px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e1e9e3;border-radius:18px;overflow:hidden">
          <tr><td style="height:5px;background:#22e879;font-size:0;line-height:0">&nbsp;</td></tr>
          <tr><td style="padding:32px 36px 8px">
            <a href="https://play-up.fit" style="display:inline-block;text-decoration:none"><img src="https://play-up.fit/playup-email-logo.png" width="184" height="45" alt="PlayUp" style="display:block;width:184px;height:auto;border:0"></a>
          </td></tr>
          <tr><td style="padding:20px 36px 32px">
            <p style="margin:0 0 10px;color:#168447;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase">ACCOUNT SECURITY</p>
            <h1 style="margin:0 0 14px;font-size:27px;line-height:1.25;letter-spacing:-.4px">Reset your password</h1>
            <p style="margin:0 0 24px;color:#4e5d53;font-size:16px;line-height:1.65">We received a request to reset the password for your PlayUp account. Use the secure button below to choose a new password.</p>
            <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;border-radius:10px;background:#168447;color:#fff;padding:14px 24px;font-size:15px;font-weight:700;text-decoration:none">Reset password</a></p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#f4f8f5;border-radius:10px"><tr><td style="padding:14px 16px;color:#43544a;font-size:14px;line-height:1.6"><strong style="color:#14221a">This link expires in one hour.</strong><br>For your security, it can only be used once.</td></tr></table>
            <p style="margin:0 0 8px;color:#536258;font-size:14px;line-height:1.6">If the button does not work, copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;overflow-wrap:anywhere;font-size:13px;line-height:1.6"><a href="${safeUrl}" style="color:#126a38">${safeUrl}</a></p>
            <p style="margin:0 0 20px;color:#536258;font-size:14px;line-height:1.6">If you did not request this change, you can ignore this email. Your password will stay the same.</p>
            <p style="margin:0;color:#536258;font-size:14px;line-height:1.6">Need help? Contact <a href="mailto:info@creativnetworks.com" style="color:#126a38;text-decoration:underline">PlayUp Support</a>.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e8eee9;padding:18px 36px;background:#fbfcfb;color:#748078;font-size:12px;line-height:1.6">PlayUp Support<br>This is an automated transactional email. Replies to this message may not be monitored.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { text, html };
}
