import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmButton } from "@/components/confirm-button";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { money,gameDate } from "@/lib/data";
import { adminCancelBookingAction } from "@/app/actions";
import { redirect } from "next/navigation";
type Row={id:string;reference:string;title:string;game_id:string;user_name:string;starts_at:string;status:string;payment_status:string;amount_fils:number};
export default async function AdminBookings({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}){
 const f=await searchParams,user=await currentUser();if(!user)redirect("/login");if(!["ORGANIZER","ADMIN","SUPER_ADMIN","SCOREKEEPER"].includes(user.role))redirect("/games");const own=!(["ADMIN","SUPER_ADMIN"].includes(user.role));
 const rows=await query<Row>(`SELECT b.id,b.reference,b.game_id,b.status,b.payment_status,b.amount_fils,g.title,g.starts_at,u.name AS user_name FROM bookings b JOIN games g ON g.id=b.game_id JOIN users u ON u.id=b.user_id ${own?"WHERE g.organizer_id=$1 OR g.scorekeeper_id=$1":""} ORDER BY b.created_at DESC LIMIT 200`,own?[user.id]:[]);
 return <AdminShell><div className="page-head"><h1>Bookings</h1><p>Review participants and payment status.</p></div>{f.error&&<div className="alert alert-error">{f.error}</div>}{f.notice&&<div className="alert">{f.notice}</div>}<div className="card table-wrap"><table className="table"><thead><tr><th>Reference</th><th>Game</th><th>Player</th><th>Date</th><th>Amount</th><th>Booking</th><th>Payment</th><th></th></tr></thead><tbody>{rows.map(b=><tr key={b.id}><td>{b.reference}</td><td><Link href={`/admin/games/${b.game_id}`}>{b.title}</Link></td><td>{b.user_name}</td><td>{gameDate(b.starts_at)}</td><td>{money(b.amount_fils)}</td><td>{b.status}</td><td>{b.payment_status}</td><td>{user.role!=="SCOREKEEPER"&&b.status==="CONFIRMED"&&new Date(b.starts_at)>new Date()&&<form action={adminCancelBookingAction}><input type="hidden" name="bookingId" value={b.id}/><ConfirmButton className="text-button" message="Remove this player and refund the booking?">Refund</ConfirmButton></form>}</td></tr>)}</tbody></table></div></AdminShell>;
}
