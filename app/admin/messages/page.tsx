import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
type Message={id:string;name:string;email:string;body:string;created_at:string};
type Count={n:string};
export default async function Messages({searchParams}:{searchParams:Promise<{page?:string}>}){
 const user=await currentUser();if(!user)redirect("/login");if(!["ADMIN","SUPER_ADMIN"].includes(user.role))redirect("/admin");
 const {page:rawPage}=await searchParams;
 const total=await one<Count>("SELECT count(*)::text AS n FROM contact_messages");
 const pages=Math.max(1,Math.ceil(Number(total?.n||0)/25));
 const requested=Number(rawPage);
 const page=Number.isSafeInteger(requested)&&requested>0?Math.min(pages,requested):1;
 const messages=await query<Message>("SELECT id,name,email,body,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 25 OFFSET $1",[(page-1)*25]);
 return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Inbox</span><h1>Messages</h1><p>Contact form submissions from PLAYO visitors.</p></div><span className="admin-count">{total?.n||0} messages</span></div>{messages.length?messages.map(m=><div className="admin-panel admin-message" key={m.id}><div className="admin-post-head"><strong>{m.name}</strong><small>{new Date(m.created_at).toLocaleString("en-JO",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Amman"})}</small></div><a className="inline-link" href={`mailto:${m.email}`}>{m.email}</a><p>{m.body}</p></div>):<div className="empty">No messages yet.</div>}{pages>1&&<nav className="pagination" aria-label="Message pages">{page>1&&<Link href={`/admin/messages?page=${page-1}`}>Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={`/admin/messages?page=${page+1}`}>Next</Link>}</nav>}</AdminShell>;
}
