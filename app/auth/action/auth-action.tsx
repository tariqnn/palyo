"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";

const FIREBASE_API_KEY = "AIzaSyCF8alVbRpWhFFJoIoVxOjwuz0XFOB86g0";

type Props = { mode: string; code: string; apiKey: string };
type State = "checking" | "ready" | "working" | "done" | "error";

function readableError(message: string) {
  if (/EXPIRED|INVALID_OOB_CODE|INVALID_CODE/i.test(message)) return "This link has expired or has already been used. Request a new password reset from the PlayUp app.";
  if (/WEAK_PASSWORD/i.test(message)) return "Choose a stronger password with at least 6 characters.";
  if (/TOO_MANY_ATTEMPTS/i.test(message)) return "Too many attempts. Please wait a little and try again.";
  return "We could not complete this request. Request a fresh link from the PlayUp app or contact support.";
}

export function AuthAction({ mode, code, apiKey }: Props) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const supported = mode === "resetPassword" || mode === "verifyEmail" || mode === "recoverEmail";
  const validRequest = supported && code.length > 10 && apiKey === FIREBASE_API_KEY;

  useEffect(() => {
    if (!validRequest) {
      setError("This PlayUp link is incomplete or invalid. Request a new one from the app.");
      setState("error");
      return;
    }
    if (mode === "resetPassword") {
      void fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oobCode: code }),
      }).then(async response => {
        const data = await response.json();
        if (!response.ok || data.requestType !== "PASSWORD_RESET") throw new Error(data.error?.message ?? "INVALID_OOB_CODE");
        setEmail(data.email ?? "");
        setState("ready");
      }).catch(problem => {
        setError(readableError(String(problem?.message ?? problem)));
        setState("error");
      });
    } else {
      setState("ready");
    }
  }, [validRequest, mode, code]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "resetPassword" && password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    if (mode === "resetPassword" && password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    setState("working");
    setError("");
    try {
      const endpoint = mode === "resetPassword" ? "resetPassword" : "update";
      const body = mode === "resetPassword" ? { oobCode: code, newPassword: password } : { oobCode: code };
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${FIREBASE_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "REQUEST_FAILED");
      setState("done");
    } catch (problem) {
      setError(readableError(String(problem instanceof Error ? problem.message : problem)));
      setState("error");
    }
  }

  const heading = mode === "resetPassword" ? "Choose a new password" : mode === "verifyEmail" ? "Verify your email" : mode === "recoverEmail" ? "Restore your account email" : "Secure link unavailable";
  const description = mode === "resetPassword"
    ? email ? `Set a new password for ${email}.` : "Set a new password for your PlayUp account."
    : mode === "verifyEmail" ? "Confirm this email address for your PlayUp account."
      : mode === "recoverEmail" ? "Confirm that you want to restore the previous email address on your PlayUp account."
        : "We couldn’t verify this account link. Request a new one from the PlayUp app.";

  return <main className="auth-action-page">
    <section className="auth-action-card" aria-live="polite">
      <div className="auth-action-brand"><Image src="/playup-email-logo.png" alt="PlayUp" width={184} height={45} priority /></div>
      <div className="auth-action-accent" />
      {state === "done" ? <>
        <span className="auth-action-icon" aria-hidden="true">✓</span>
        <p className="auth-action-eyebrow">ACCOUNT SECURE</p>
        <h1>{mode === "resetPassword" ? "Password updated" : mode === "verifyEmail" ? "Email verified" : "Email restored"}</h1>
        <p className="auth-action-description">{mode === "resetPassword" ? "Your PlayUp password has been changed. You can now sign in with your new password." : "Your PlayUp account has been updated successfully."}</p>
        <a className="auth-action-button" href="/login">Continue to PlayUp</a>
      </> : <>
        <p className="auth-action-eyebrow">PLAYUP ACCOUNT SECURITY</p>
        <h1>{heading}</h1>
        <p className="auth-action-description">{description}</p>
        {state === "checking" ? <div className="auth-action-status">Checking your secure link…</div> : null}
        {state === "ready" || state === "working" ? <form onSubmit={submit} className="auth-action-form">
          {mode === "resetPassword" ? <>
            <label>New password<input autoComplete="new-password" type="password" minLength={6} required value={password} onChange={event => setPassword(event.target.value)} /></label>
            <label>Confirm new password<input autoComplete="new-password" type="password" minLength={6} required value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
          </> : null}
          <button className="auth-action-button" disabled={state === "working"} type="submit">{state === "working" ? "Please wait…" : mode === "resetPassword" ? "Update password" : mode === "verifyEmail" ? "Verify email" : "Restore email"}</button>
        </form> : null}
        {state === "error" ? <div className="auth-action-error" role="alert">{error}</div> : null}
        {state === "error" ? <a className="auth-action-button" href="/forgot-password">Request a new link</a> : null}
        <p className="auth-action-security">This secure link is private and can only be used once. If you did not request this change, you can ignore this message.</p>
      </>}
      <footer className="auth-action-footer">Need help? <a href="mailto:info@creativnetworks.com">Contact PlayUp Support</a></footer>
    </section>
  </main>;
}
