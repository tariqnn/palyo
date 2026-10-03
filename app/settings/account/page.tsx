import { redirect } from "next/navigation";
import { accountRequestAction } from "@/app/actions";
import { MemberShell } from "@/components/member-shell";
import { currentUser } from "@/lib/auth";

export default async function AccountAndData({searchParams}:{searchParams:Promise<{notice?:string;error?:string}>}){
 const user=await currentUser();if(!user)redirect("/login?next=/settings/account");const f=await searchParams;
 return <MemberShell title="Account and data" subtitle="Control your PlayUp account and personal information.">
  {f.notice&&<div className="alert" role="status">{f.notice}</div>}{f.error&&<div className="alert alert-error" role="alert">{f.error}</div>}
  <section className="card settings-form"><h2>Request your data</h2><p className="muted">Ask for a copy of the account, profile, booking, and participation information associated with {user.email}.</p><form action={accountRequestAction}><input type="hidden" name="request" value="DATA_EXPORT"/><div className="form-field"><label htmlFor="export-details">Optional details</label><textarea id="export-details" name="details" maxLength={1000} placeholder="Tell us if you need a specific date range or type of information."/></div><button className="btn btn-outline" type="submit">Request data copy</button></form></section>
  <section className="card settings-form account-danger"><h2>Request account deletion</h2><p>Deletion is reviewed to protect your identity and preserve records that must be retained for safety, disputes, or legal obligations. Active bookings should be cancelled first.</p><form action={accountRequestAction}><input type="hidden" name="request" value="ACCOUNT_DELETION"/><div className="form-field"><label htmlFor="deletion-details">Reason or instructions (optional)</label><textarea id="deletion-details" name="details" maxLength={1000}/></div><div className="form-field"><label htmlFor="confirmation">Type DELETE to confirm</label><input className="input" id="confirmation" name="confirmation" autoComplete="off" required pattern="DELETE"/></div><button className="btn btn-danger" type="submit">Submit deletion request</button></form></section>
 </MemberShell>;
}
