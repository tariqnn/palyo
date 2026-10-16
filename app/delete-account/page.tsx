import Link from "next/link";
import { appAccountDeletionRequestAction } from "./actions";

export default async function DeleteAccount({searchParams}:{searchParams:Promise<{sent?:string;error?:string}>}) {
  const f=await searchParams;
  return <main className="page"><div className="container" style={{maxWidth:760}}>
    <div className="page-head"><span className="eyebrow muted">Account and privacy</span><h1>Delete your PlayUp account</h1><p>Choose the option that matches your situation.</p></div>
    {f.sent&&<div className="alert alert-success" role="status">Your deletion request was received. PlayUp support will verify the request before processing it.</div>}
    {f.error&&<div className="alert alert-error" role="alert">{f.error}</div>}
    <section className="card" style={{padding:24,marginBottom:20}}><h2>Delete from the app</h2><p>While signed in, open <strong>Settings</strong> and choose <strong>Delete Account</strong>. The app deletes your Firebase account, profile, preferences, friendships, notifications, match messages, rewards, and related social records. Booking history is retained with your account identity removed for venue operations and financial records.</p></section>
    <section className="card" style={{padding:24}}><h2>Request deletion if you cannot sign in</h2><p>Enter the email address used for your PlayUp mobile app account. Do not include your password. Support will verify the request and process it through the app’s account-deletion system. Requests are reviewed to protect account owners and preserve booking records that must remain for operational, dispute, or legal reasons.</p>
      <form action={appAccountDeletionRequestAction}>
        <div className="form-field"><label htmlFor="name">Your name</label><input className="input" id="name" name="name" autoComplete="name" required minLength={2} maxLength={80}/></div>
        <div className="form-field"><label htmlFor="email">Email used for your PlayUp app account</label><input className="input" id="email" name="email" type="email" autoComplete="email" required/></div>
        <div className="form-field"><label htmlFor="details">Additional details (optional)</label><textarea className="input" id="details" name="details" rows={4} maxLength={1800} placeholder="Add details that help us verify the account owner."/></div>
        <button className="btn btn-primary btn-block" type="submit">Request account deletion</button>
      </form>
    </section>
    <p className="muted" style={{marginTop:20}}>Read the <Link className="inline-link" href="/privacy">Privacy Policy</Link> or <Link className="inline-link" href="/contact">contact PlayUp support</Link>.</p>
  </div></main>;
}
