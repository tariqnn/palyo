import "server-only";
import { randomUUID } from "node:crypto";
import { transaction, query, one } from "@/lib/db";
import { paymentProvider } from "@/lib/payment";

export async function bookGame(gameId:string,userId:string,recordingAcknowledged:boolean){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT * FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game) throw new Error("Game not found.");
    if(new Date(String(game.starts_at))<=new Date()) throw new Error("This game has already started.");
    if(!["PUBLISHED","FILLING","FULL"].includes(String(game.status))) throw new Error("This game is unavailable.");
    if(game.recording_enabled&&!recordingAcknowledged) throw new Error("Please acknowledge recording before booking.");
    const duplicate=(await tx.query("SELECT id,status FROM bookings WHERE game_id=$1 AND user_id=$2",[gameId,userId])).rows[0];
    if(duplicate&&duplicate.status!=="CANCELLED") throw new Error("You have already joined this game.");
    if(Number(game.booked_count)<Number(game.capacity)){
      await tx.query("UPDATE waitlist SET status='EXPIRED' WHERE game_id=$1 AND status='OFFERED' AND expires_at<now()",[gameId]);
      const active=(await tx.query("SELECT id,user_id FROM waitlist WHERE game_id=$1 AND status='OFFERED' AND expires_at>now() ORDER BY position LIMIT 1",[gameId])).rows[0];
      if(!active){const next=(await tx.query("SELECT id,user_id FROM waitlist WHERE game_id=$1 AND status='WAITING' ORDER BY position LIMIT 1 FOR UPDATE",[gameId])).rows[0];if(next)await tx.query("UPDATE waitlist SET status='OFFERED',offered_at=now(),expires_at=now()+interval '2 hours' WHERE id=$1",[next.id]);}
    }
    const reserved=(await tx.query("SELECT user_id FROM waitlist WHERE game_id=$1 AND status='OFFERED' AND expires_at>now() ORDER BY position LIMIT 1",[gameId])).rows[0];
    if(Number(game.booked_count)>=Number(game.capacity)||(reserved&&reserved.user_id!==userId)){
      const prev=(await tx.query("SELECT position,status FROM waitlist WHERE game_id=$1 AND user_id=$2",[gameId,userId])).rows[0];
      if(prev&&prev.status==="WAITING") return {kind:"waitlist",position:Number(prev.position)};
      const next=(await tx.query("SELECT COALESCE(MAX(position),0)+1 AS position FROM waitlist WHERE game_id=$1",[gameId])).rows[0];
      const position=Number(next.position);
      await tx.query("INSERT INTO waitlist(id,game_id,user_id,position) VALUES($1,$2,$3,$4) ON CONFLICT(game_id,user_id) DO UPDATE SET status='WAITING',position=$4",[randomUUID(),gameId,userId,position]);
      return {kind:"waitlist",position};
    }
    const bookingId=randomUUID(), reference=`PLY-${randomUUID().slice(0,6).toUpperCase()}`;
    const amount=Number(game.price_fils);
    if(duplicate) await tx.query("UPDATE bookings SET status='PENDING',payment_status='PENDING',reference=$1,amount_fils=$2,recording_acknowledged=$3 WHERE id=$4",[reference,amount,recordingAcknowledged,duplicate.id]);
    else await tx.query("INSERT INTO bookings(id,reference,game_id,user_id,amount_fils,recording_acknowledged) VALUES($1,$2,$3,$4,$5,$6)",[bookingId,reference,gameId,userId,amount,recordingAcknowledged]);
    const actualId=duplicate?String(duplicate.id):bookingId;
    const charge=await paymentProvider().charge({amountFils:amount,currency:"JOD",idempotencyKey:reference});
    if(charge.status!=="PAID") throw new Error("Payment failed. Please try again.");
    await tx.query("INSERT INTO payments(id,booking_id,provider,provider_ref,amount_fils,status,idempotency_key) VALUES($1,$2,'mock',$3,$4,'PAID',$5) ON CONFLICT(booking_id) DO UPDATE SET status='PAID',provider_ref=$3,amount_fils=$4,idempotency_key=$5",[randomUUID(),actualId,charge.reference,amount,reference]);
    await tx.query("UPDATE bookings SET status='CONFIRMED',payment_status='PAID' WHERE id=$1",[actualId]);
    await tx.query("UPDATE waitlist SET status='JOINED' WHERE game_id=$1 AND user_id=$2",[gameId,userId]);
    await tx.query("UPDATE games SET booked_count=booked_count+1,status=CASE WHEN booked_count+1>=capacity THEN 'FULL' ELSE 'FILLING' END WHERE id=$1",[gameId]);
    await tx.query("INSERT INTO notifications(id,user_id,type,title,body,href) VALUES($1,$2,'BOOKING','Booking confirmed',$3,$4)",[randomUUID(),userId,`You're in! Reference ${reference}`,`/bookings`]);
    return {kind:"booking",reference};
  });
}
export async function cancelBooking(bookingId:string,userId:string){
  return transaction(async tx=>{
    const bookingGame=(await tx.query("SELECT game_id FROM bookings WHERE id=$1 AND user_id=$2",[bookingId,userId])).rows[0];
    if(!bookingGame)throw new Error("Booking not found.");
    await tx.query("SELECT id FROM games WHERE id=$1 FOR UPDATE",[bookingGame.game_id]);
    const booking=(await tx.query("SELECT b.*,g.starts_at,g.status AS game_status FROM bookings b JOIN games g ON g.id=b.game_id WHERE b.id=$1 FOR UPDATE OF b",[bookingId])).rows[0];
    if(!booking||booking.user_id!==userId) throw new Error("Booking not found.");
    if(booking.status!=="CONFIRMED") throw new Error("This booking cannot be cancelled.");
    if(new Date(String(booking.starts_at))<=new Date()) throw new Error("This game has already started.");
    const pay=(await tx.query("SELECT * FROM payments WHERE booking_id=$1",[bookingId])).rows[0];
    if(pay&&pay.status==="PAID"){
      const refund=await paymentProvider().refund({reference:String(pay.provider_ref),amountFils:Number(pay.amount_fils),idempotencyKey:`refund_${bookingId}`});
      if(refund.status!=="REFUNDED") throw new Error("Refund failed.");
      await tx.query("UPDATE payments SET status='REFUNDED' WHERE booking_id=$1 AND status='PAID'",[bookingId]);
    }
    await tx.query("UPDATE bookings SET status='CANCELLED',payment_status='REFUNDED' WHERE id=$1",[bookingId]);
    await tx.query("UPDATE games SET booked_count=booked_count-1,status='FILLING' WHERE id=$1",[booking.game_id]);
    const next=(await tx.query("SELECT * FROM waitlist WHERE game_id=$1 AND status='WAITING' ORDER BY position LIMIT 1 FOR UPDATE",[booking.game_id])).rows[0];
    if(next){
      await tx.query("UPDATE waitlist SET status='OFFERED',offered_at=now(),expires_at=now()+interval '2 hours' WHERE id=$1",[next.id]);
      await tx.query("INSERT INTO notifications(id,user_id,type,title,body,href) VALUES($1,$2,'WAITLIST','A spot opened up','Book your place before it fills.',$3)",[randomUUID(),next.user_id,`/games/${booking.game_id}`]);
    }
    return true;
  });
}
export async function myBooking(gameId:string,userId:string){return one<{id:string;status:string;reference:string}>("SELECT id,status,reference FROM bookings WHERE game_id=$1 AND user_id=$2",[gameId,userId]);}
export async function bookingList(userId:string){return query("SELECT b.*,g.title,g.sport,g.format,g.starts_at,g.image_url,v.name AS venue_name,v.area FROM bookings b JOIN games g ON g.id=b.game_id JOIN venues v ON v.id=g.venue_id WHERE b.user_id=$1 ORDER BY g.starts_at DESC",[userId]);}
export async function cancelGame(gameId:string,actorId:string){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT id,status FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game)throw new Error("Game not found.");
    if(game.status==="CANCELLED")return;
    if(game.status==="COMPLETED")throw new Error("A completed game cannot be cancelled.");
    const bookings=(await tx.query("SELECT b.id,b.user_id,p.provider_ref,p.amount_fils,p.status AS payment_status FROM bookings b LEFT JOIN payments p ON p.booking_id=b.id WHERE b.game_id=$1 AND b.status='CONFIRMED' FOR UPDATE OF b",[gameId])).rows;
    for(const booking of bookings){
      if(booking.payment_status==="PAID"){
        const refund=await paymentProvider().refund({reference:String(booking.provider_ref),amountFils:Number(booking.amount_fils),idempotencyKey:`refund_${booking.id}`});
        if(refund.status!=="REFUNDED")throw new Error("Refund failed; cancellation was not applied.");
        await tx.query("UPDATE payments SET status='REFUNDED' WHERE booking_id=$1 AND status='PAID'",[booking.id]);
      }
      await tx.query("UPDATE bookings SET status='CANCELLED',payment_status='REFUNDED' WHERE id=$1",[booking.id]);
      await tx.query("INSERT INTO notifications(id,user_id,type,title,body,href) VALUES($1,$2,'GAME_CANCELLED','Game cancelled','Your game was cancelled and payment refunded.',$3)",[randomUUID(),booking.user_id,`/games/${gameId}`]);
    }
    await tx.query("UPDATE waitlist SET status='CANCELLED' WHERE game_id=$1 AND status IN ('WAITING','OFFERED')",[gameId]);
    await tx.query("UPDATE games SET status='CANCELLED',booked_count=0 WHERE id=$1",[gameId]);
    await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,new_data) VALUES($1,$2,'GAME_CANCELLED','game',$3,$4)",[randomUUID(),actorId,gameId,JSON.stringify({refundedBookings:bookings.length})]);
  });
}
