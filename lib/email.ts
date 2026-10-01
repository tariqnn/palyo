import "server-only";
import nodemailer from "nodemailer";

const subject = "Reset your PlayUp password";
const body = (url: string) => `Use this link to reset your password. It expires in one hour.\n\n${url}\n\nIf you did not ask for this, you can ignore this email.`;

/** Sends through Resend (RESEND_API_KEY + EMAIL_FROM) or any SMTP server (SMTP_HOST/USER/PASSWORD/FROM). */
export async function sendResetEmail(to: string, url: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (resendKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text: body(url) }),
    });
    if (!response.ok) throw new Error("Could not send the reset email. Please try again later.");
    return;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
    if (process.env.NODE_ENV === "production") throw new Error("Password reset email is not configured.");
    console.log(`Development password reset for ${to}: ${url}`);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text: body(url) });
}
