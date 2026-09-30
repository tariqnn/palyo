import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
type Message={id:string;name:string;email:string;body:string;created_at:string};
export default async function Messages(){const user=await currentUser();if(!user||!["ADMIN","SUPER_ADMIN"].includes(user.role))redirect("/admin");const messages=await query<Message>("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100");return <AdminShell><div className="page-head"><h1>Messages</h1><p>Contact form submissions.</p></div>{messages.length?messages.map(m=><div className="card" key={m.id} style={{padding:18,marginBottom:10}}><strong>{m.name}</strong> · {m.email}<p>{m.body}</p><small className="muted">{new Date(m.created_at).toLocaleString("en-JO")}</small></div>):<div className="empty">No messages yet.</div>}</AdminShell>}
