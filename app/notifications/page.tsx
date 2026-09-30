import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { markNotificationsReadAction } from "@/app/actions";

type NotificationRow={id:string;title:string;body:string;href:string|null;read_at:string|null;created_at:string};
export default async function Notifications(){
  const user=await currentUser();if(!user)redirect("/login");
  const rows=await query<NotificationRow>("SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",[user.id]);
  const unread=rows.filter(n=>!n.read_at).length;
  return <main className="page"><div className="container" style={{maxWidth:850}}>
    <div className="page-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h1>Notifications</h1><p>{unread} unread</p></div>{unread>0&&<form action={markNotificationsReadAction}><button className="btn btn-outline">Mark all as read</button></form>}</div>
    {rows.length?rows.map(n=><Link className="card" style={{display:"block",padding:16,marginBottom:8,borderLeft:n.read_at?undefined:"3px solid var(--green)"}} href={n.href||"/notifications"} key={n.id}><strong>{n.title}</strong><p style={{margin:"3px 0"}}>{n.body}</p><small className="muted">{new Date(n.created_at).toLocaleString("en-JO")}</small></Link>):<div className="empty">No notifications yet.</div>}
  </div></main>;
}
