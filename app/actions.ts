"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser, login, signup, signOut, requireManager, requestPasswordReset,resetPassword } from "@/lib/auth";
import { bookGame, cancelBooking, cancelGame } from "@/lib/booking";
import { addScoreEvent, finalizeGame, generateTeams, undoScoreEvent } from "@/lib/competition";
import { eventSchema } from "@/lib/scoring";
import { controlGameClock } from "@/lib/clock";
import { query, one, transaction } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createGameStream,endGameStream,type Visibility } from "@/lib/streaming";
import { DateTime } from "luxon";
import { requireAcademyAccess } from "@/lib/academy";

const errorText=(e:unknown)=>e instanceof Error?e.message:"Something went wrong. Please try again.";
async function organizerFor(gameId:string){const user=await requireManager(gameId);const game=await one<{organizer_id:string}>("SELECT organizer_id FROM games WHERE id=$1",[gameId]);if(!game||!(game.organizer_id===user.id||["ADMIN","SUPER_ADMIN"].includes(user.role)))throw new Error("Organizer access is required.");return user;}
export async function loginAction(form:FormData){let error="";try{await login(String(form.get("email")||""),String(form.get("password")||""));}catch(e){error=errorText(e);}if(error)redirect(`/login?error=${encodeURIComponent(error)}`);redirect("/games");}
export async function signupAction(form:FormData){let error="";try{await signup(Object.fromEntries(form));}catch(e){error=errorText(e);}if(error)redirect(`/signup?error=${encodeURIComponent(error)}`);redirect("/onboarding/sports");}
export async function logoutAction(){await signOut();redirect("/");}
export async function bookAction(form:FormData){
  const id=String(form.get("gameId")||"");let error="",result:Awaited<ReturnType<typeof bookGame>>|null=null;
  try{const user=await currentUser();if(!user)redirect(`/login?next=/games/${id}`);result=await bookGame(id,user!.id,form.get("recordingAck")==="on");}catch(e){if(e&&typeof e==="object"&&"digest" in e)throw e;error=errorText(e);}
  if(error)redirect(`/games/${id}?error=${encodeURIComponent(error)}`);
  revalidatePath(`/games/${id}`);revalidatePath("/games");
  if(result?.kind==="waitlist")redirect(`/games/${id}?notice=${encodeURIComponent(`You're #${result.position} on the waitlist.`)}`);
  redirect(`/bookings?notice=${encodeURIComponent(`You're in! Booking reference ${result?.reference}`)}`);
}
export async function cancelBookingAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");let error="";try{await cancelBooking(String(form.get("bookingId")),user.id);}catch(e){error=errorText(e);}revalidatePath("/bookings");redirect(error?`/bookings?error=${encodeURIComponent(error)}`:"/bookings?notice=Booking%20cancelled");}
export async function onboardingAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");const selected=form.getAll("sports").map(String).filter(s=>["football","basketball","dodgeball","tennis"].includes(s));for(const sport of selected)await query("INSERT INTO sport_profiles(user_id,sport,position,preferred_foot,dominant_hand,tennis_preference,skill) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,sport) DO UPDATE SET position=$3,preferred_foot=$4,dominant_hand=$5,tennis_preference=$6,skill=$7",[user.id,sport,form.get(`${sport}_position`)||null,form.get("preferred_foot")||null,form.get("dominant_hand")||null,form.get("tennis_preference")||null,form.get(`${sport}_skill`)||"Intermediate"]);redirect(`/profile/${user.username}`);}
export async function scoreAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id);const input=eventSchema.parse({type:form.get("type"),team:form.get("team"),playerId:form.get("playerId")||undefined,assistId:form.get("assistId")||undefined,period:form.get("period")||undefined,clockSeconds:form.get("clockSeconds")||undefined});await addScoreEvent(id,user.id,input);}catch(e){error=errorText(e);}revalidatePath(`/games/${id}/score`);redirect(error?`/admin/games/${id}/scorekeeper?error=${encodeURIComponent(error)}`:`/admin/games/${id}/scorekeeper`);}
export async function clockAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id);const command=z.enum(["START","PAUSE","RESET","NEXT_PERIOD"]).parse(form.get("command"));await controlGameClock(id,user.id,command);}catch(e){error=errorText(e);}revalidatePath(`/games/${id}/score`);redirect(error?`/admin/games/${id}/scorekeeper?error=${encodeURIComponent(error)}`:`/admin/games/${id}/scorekeeper`);}
export async function undoAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id);await undoScoreEvent(id,user.id);}catch(e){error=errorText(e);}revalidatePath(`/games/${id}/score`);redirect(error?`/admin/games/${id}/scorekeeper?error=${encodeURIComponent(error)}`:`/admin/games/${id}/scorekeeper`);}
export async function finalizeAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id);await finalizeGame(id,user.id);}catch(e){error=errorText(e);}revalidatePath(`/games/${id}`);redirect(error?`/admin/games/${id}/scorekeeper?error=${encodeURIComponent(error)}`:`/games/${id}/score?notice=Result%20final`);}
export async function teamsAction(form:FormData){const id=String(form.get("gameId"));let error="";try{await organizerFor(id);await generateTeams(id);}catch(e){error=errorText(e);}redirect(error?`/admin/games/${id}?error=${encodeURIComponent(error)}`:`/admin/games/${id}?notice=Teams%20generated`);}
const gameSchema=z.object({sport:z.enum(["football","basketball","dodgeball","tennis"]),title:z.string().min(5),format:z.string().min(2),venueId:z.string().uuid(),startsAt:z.iso.datetime({local:true}),capacity:z.coerce.number().int().min(2).max(100),price:z.coerce.number().min(0).max(100),skill:z.string(),description:z.string().max(2000),recordingEnabled:z.boolean(),tennisBestOf:z.enum(["3","5"]).default("3"),tennisTiebreak:z.boolean()});
export async function createGameAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");const playerFlow=form.get("source")==="player";if(!playerFlow&&!["ORGANIZER","ADMIN","SUPER_ADMIN"].includes(user.role))redirect("/admin?error=Organizer%20access%20required");let error="",id="";try{const input=gameSchema.parse({sport:form.get("sport"),title:form.get("title"),format:form.get("format"),venueId:form.get("venueId"),startsAt:form.get("startsAt"),capacity:form.get("capacity"),price:form.get("price"),skill:form.get("skill"),description:form.get("description"),recordingEnabled:form.get("recordingEnabled")==="on",tennisBestOf:form.get("tennisBestOf")||"3",tennisTiebreak:form.get("tennisTiebreak")==="on"});const venue=await one<{image_url:string}>("SELECT image_url FROM venues WHERE id=$1 AND $2=ANY(sports)",[input.venueId,input.sport]);if(!venue)throw new Error("Choose a venue that supports this sport.");const zoned=DateTime.fromISO(input.startsAt,{zone:"Asia/Amman"});if(!zoned.isValid||zoned.toMillis()<=Date.now())throw new Error("Choose a future start time in Amman.");id=randomUUID();const start=zoned.toJSDate();await query("INSERT INTO games(id,sport,title,format,description,venue_id,organizer_id,starts_at,ends_at,capacity,price_fils,skill,image_url,recording_enabled,stream_enabled,score_config) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14,$15)",[id,input.sport,input.title,input.format,input.description,input.venueId,user.id,start,new Date(start.getTime()+90*60000),input.capacity,Math.round(input.price*1000),input.skill,venue.image_url,input.recordingEnabled,JSON.stringify(input.sport==="tennis"?{tennisBestOf:Number(input.tennisBestOf),tennisTiebreak:input.tennisTiebreak}:{})]);}catch(e){error=errorText(e);}if(playerFlow)redirect(error?`/matches/create?error=${encodeURIComponent(error)}`:`/games/${id}?notice=Match%20created`);redirect(error?`/admin/games/new?error=${encodeURIComponent(error)}`:`/admin/games/${id}`);}
export async function postAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");const body=String(form.get("body")||"").trim();if(body.length>0&&body.length<=1000)await query("INSERT INTO posts(id,user_id,body) VALUES($1,$2,$3)",[randomUUID(),user.id,body]);revalidatePath("/community");redirect("/community");}
export async function likeAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");await query("INSERT INTO post_likes(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[String(form.get("postId")),user.id]);revalidatePath("/community");redirect("/community");}
export async function commentAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");const body=String(form.get("body")||"").trim();if(body.length>0&&body.length<=500)await query("INSERT INTO post_comments(id,post_id,user_id,body) VALUES($1,$2,$3,$4)",[randomUUID(),String(form.get("postId")),user.id,body]);revalidatePath("/community");redirect("/community");}
export async function joinTournamentAction(form:FormData){const user=await currentUser();if(!user)redirect("/login");const id=String(form.get("id")),teamName=String(form.get("teamName")||"").trim().slice(0,60)||null;const tournament=await one<{status:string;starts_at:string}>("SELECT status,starts_at FROM tournaments WHERE id=$1",[id]);if(!tournament||tournament.status!=="OPEN"||new Date(tournament.starts_at)<=new Date())redirect(`/tournaments/${id}?error=Registration%20is%20closed`);await query("INSERT INTO tournament_entries(tournament_id,user_id,team_name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[id,user.id,teamName]);revalidatePath("/tournaments");redirect(`/tournaments/${id}?notice=You%20joined%20the%20tournament`);}
export async function createStreamAction(form:FormData){const id=String(form.get("gameId"));let error="";try{await organizerFor(id);const visibility=z.enum(["PUBLIC","PARTICIPANTS_ONLY","UNLISTED","PRIVATE"]).parse(form.get("visibility"));await createGameStream(id,visibility as Visibility);}catch(e){error=errorText(e);}redirect(error?`/admin/games/${id}?error=${encodeURIComponent(error)}`:`/admin/games/${id}?notice=Stream%20created`);}
export async function endStreamAction(form:FormData){const id=String(form.get("gameId"));let error="";try{await organizerFor(id);await endGameStream(id);}catch(e){error=errorText(e);}redirect(error?`/admin/games/${id}?error=${encodeURIComponent(error)}`:`/admin/games/${id}?notice=Stream%20ended`);}
export async function forgotAction(form:FormData){let error="",devUrl:string|null=null;try{devUrl=await requestPasswordReset(String(form.get("email")||""));}catch(e){error=errorText(e);}if(error)redirect(`/forgot-password?error=${encodeURIComponent(error)}`);redirect(`/forgot-password?sent=1${devUrl?`&devUrl=${encodeURIComponent(devUrl)}`:""}`);}
export async function resetPasswordAction(form:FormData){const token=String(form.get("token")||"");let error="";try{const password=String(form.get("password")||"");if(password!==form.get("confirm"))throw new Error("Passwords do not match.");await resetPassword(token,password);}catch(e){error=errorText(e);}if(error)redirect(`/reset-password/${token}?error=${encodeURIComponent(error)}`);redirect("/login?notice=Password%20updated");}
export async function contactAction(form:FormData){let error="";try{const input=z.object({name:z.string().trim().min(2).max(80),email:z.email(),body:z.string().trim().min(10).max(2000)}).parse({name:form.get("name"),email:form.get("email"),body:form.get("body")});const recent=await one<{n:string}>("SELECT count(*)::text AS n FROM contact_messages WHERE email=$1 AND created_at>now()-interval '15 minutes'",[input.email]);if(Number(recent?.n||0)>=3)throw new Error("Please wait before sending another message.");await query("INSERT INTO contact_messages(id,name,email,body) VALUES($1,$2,$3,$4)",[randomUUID(),input.name,input.email,input.body]);}catch(e){error=errorText(e);}redirect(error?`/contact?error=${encodeURIComponent(error)}`:"/contact?sent=1");}
export async function reviewAction(form:FormData){const id=String(form.get("gameId")||"");const user=await currentUser();if(!user)redirect("/login");let error="";try{const input=z.object({venue:z.coerce.number().int().min(1).max(5),organization:z.coerce.number().int().min(1).max(5),experience:z.coerce.number().int().min(1).max(5),body:z.string().trim().max(1000)}).parse({venue:form.get("venue"),organization:form.get("organization"),experience:form.get("experience"),body:form.get("body")||""});const eligible=await one<{venue_id:string}>("SELECT g.venue_id FROM games g JOIN bookings b ON b.game_id=g.id WHERE g.id=$1 AND b.user_id=$2 AND g.status='COMPLETED' AND b.status='COMPLETED'",[id,user.id]);if(!eligible)throw new Error("Only players who completed this game can review it.");await query("INSERT INTO reviews(id,game_id,user_id,venue_rating,organization_rating,experience_rating,body) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(game_id,user_id) DO UPDATE SET venue_rating=$4,organization_rating=$5,experience_rating=$6,body=$7",[randomUUID(),id,user.id,input.venue,input.organization,input.experience,input.body]);await query("UPDATE venues SET rating=COALESCE((SELECT ROUND(AVG(r.venue_rating)::numeric,1) FROM reviews r JOIN games g ON g.id=r.game_id WHERE g.venue_id=$1),rating) WHERE id=$1",[eligible.venue_id]);}catch(e){error=errorText(e);}revalidatePath(`/games/${id}`);redirect(error?`/games/${id}?tab=reviews&error=${encodeURIComponent(error)}`:`/games/${id}?tab=reviews&notice=Review%20saved`);}
export async function markNotificationsReadAction(){const user=await currentUser();if(!user)redirect("/login");await query("UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL",[user.id]);revalidatePath("/notifications");redirect("/notifications");}
export async function selectMvpAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id),nominee=String(form.get("playerId"));const game=await one<{organizer_id:string;finalized_at:string|null}>("SELECT organizer_id,finalized_at FROM games WHERE id=$1",[id]);if(!game||game.finalized_at||!(game.organizer_id===user.id||["ADMIN","SUPER_ADMIN"].includes(user.role)))throw new Error("Only the organizer can select an MVP before finalization.");const exists=await one("SELECT id FROM bookings WHERE game_id=$1 AND user_id=$2 AND status IN ('CONFIRMED','COMPLETED')",[id,nominee]);if(!exists)throw new Error("Choose a booked player.");await query("UPDATE games SET mvp_id=$1 WHERE id=$2 AND finalized_at IS NULL",[nominee,id]);await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,new_data) VALUES($1,$2,'MVP_SELECTED','game',$3,$4)",[randomUUID(),user.id,id,JSON.stringify({mvpId:nominee})]);}catch(e){error=errorText(e);}redirect(error?`/admin/games/${id}?error=${encodeURIComponent(error)}`:`/admin/games/${id}?notice=MVP%20selected`);}
export async function voteMvpAction(form:FormData){const id=String(form.get("gameId")),nominee=String(form.get("playerId"));const user=await currentUser();if(!user)redirect("/login");let error="";try{const game=await one<{mvp_enabled:boolean;finalized_at:string|null}>("SELECT mvp_enabled,finalized_at FROM games WHERE id=$1",[id]);if(!game?.mvp_enabled||game.finalized_at)throw new Error("MVP voting is closed.");const [voter,player]=await Promise.all([one("SELECT id FROM bookings WHERE game_id=$1 AND user_id=$2 AND status IN ('CONFIRMED','COMPLETED')",[id,user.id]),one("SELECT id FROM bookings WHERE game_id=$1 AND user_id=$2 AND status IN ('CONFIRMED','COMPLETED')",[id,nominee])]);if(!voter||!player)throw new Error("Only booked players can vote for another booked player.");const existing=await one("SELECT voter_id FROM mvp_votes WHERE game_id=$1 AND voter_id=$2",[id,user.id]);if(existing)throw new Error("You have already voted.");await query("INSERT INTO mvp_votes(game_id,voter_id,nominee_id) VALUES($1,$2,$3)",[id,user.id,nominee]);}catch(e){error=errorText(e);}redirect(error?`/games/${id}/mvp?error=${encodeURIComponent(error)}`:`/games/${id}/mvp?notice=Vote%20recorded`);}
export async function cancelGameAction(form:FormData){const id=String(form.get("gameId"));let error="";try{const user=await requireManager(id),game=await one<{organizer_id:string}>("SELECT organizer_id FROM games WHERE id=$1",[id]);if(!game||!(game.organizer_id===user.id||["ADMIN","SUPER_ADMIN"].includes(user.role)))throw new Error("Only the organizer can cancel this game.");await cancelGame(id,user.id);}catch(e){error=errorText(e);}revalidatePath("/games");redirect(error?`/admin/games/${id}?error=${encodeURIComponent(error)}`:`/admin/games/${id}?notice=Game%20cancelled`);}
export async function markCashCollectedAction(form:FormData){const id=String(form.get("bookingId"));let error="";try{const booking=await one<{game_id:string}>("SELECT game_id FROM bookings WHERE id=$1",[id]);if(!booking)throw new Error("Booking not found.");const user=await organizerFor(booking.game_id);await query("UPDATE bookings SET payment_status='PAID' WHERE id=$1 AND status IN ('CONFIRMED','COMPLETED') AND payment_status='PAY_AT_VENUE'",[id]);await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,'CASH_COLLECTED','booking',$3)",[randomUUID(),user.id,id]);}catch(e){error=errorText(e);}redirect(error?`/admin/bookings?error=${encodeURIComponent(error)}`:"/admin/bookings?notice=Cash%20payment%20recorded");}
export async function adminCancelBookingAction(form:FormData){const id=String(form.get("bookingId"));let error="";try{const booking=await one<{game_id:string;user_id:string}>("SELECT game_id,user_id FROM bookings WHERE id=$1",[id]);if(!booking)throw new Error("Booking not found.");const user=await organizerFor(booking.game_id);await cancelBooking(id,booking.user_id);await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,'PLAYER_REMOVED','booking',$3)",[randomUUID(),user.id,id]);}catch(e){error=errorText(e);}redirect(error?`/admin/bookings?error=${encodeURIComponent(error)}`:"/admin/bookings?notice=Booking%20cancelled");}

export async function adminDeletePostAction(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const postId = String(form.get("postId") || "");
  if (!z.string().uuid().safeParse(postId).success) redirect("/admin/community?error=Invalid%20post");
  try {
    await transaction(async tx => {
      const post = (await tx.query("SELECT user_id FROM posts WHERE id=$1 FOR UPDATE", [postId])).rows[0];
      if (!post) throw new Error("Post not found.");
      await tx.query("DELETE FROM post_likes WHERE post_id=$1", [postId]);
      await tx.query("DELETE FROM post_comments WHERE post_id=$1", [postId]);
      await tx.query("DELETE FROM posts WHERE id=$1", [postId]);
      await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,old_data) VALUES($1,$2,'POST_REMOVED','post',$3,$4)", [randomUUID(), user.id, postId, JSON.stringify({ authorId: post.user_id })]);
    });
  } catch (error) {
    redirect(`/admin/community?error=${encodeURIComponent(errorText(error))}`);
  }
  revalidatePath("/community");
  revalidatePath("/admin/community");
  redirect("/admin/community?notice=Post%20removed");
}

export async function updateProfileAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");let error="";
  try{const input=z.object({name:z.string().trim().min(2).max(80),city:z.string().trim().min(2).max(80),bio:z.string().trim().max(500)}).parse({name:form.get("name"),city:form.get("city"),bio:form.get("bio")||""});await query("UPDATE users SET name=$1,city=$2,bio=$3 WHERE id=$4",[input.name,input.city,input.bio,user.id]);}catch(e){error=errorText(e);}
  revalidatePath(`/profile/${user.username}`);redirect(error?`/settings/profile?error=${encodeURIComponent(error)}`:"/settings/profile?notice=Profile%20updated");
}

export async function friendRequestAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const target=String(form.get("userId")||"");let error="";
  try{if(target===user.id)throw new Error("You cannot add yourself.");const reverse=await one<{id:string;status:string}>("SELECT id,status FROM friendships WHERE requester_id=$1 AND addressee_id=$2",[target,user.id]);if(reverse?.status==="PENDING")await query("UPDATE friendships SET status='ACCEPTED',updated_at=now() WHERE id=$1",[reverse.id]);else await query("INSERT INTO friendships(id,requester_id,addressee_id) VALUES($1,$2,$3) ON CONFLICT(requester_id,addressee_id) DO NOTHING",[randomUUID(),user.id,target]);}catch(e){error=errorText(e);}
  revalidatePath("/friends");redirect(error?`/friends?tab=suggested&error=${encodeURIComponent(error)}`:"/friends?tab=suggested&notice=Request%20sent");
}

export async function friendRespondAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const id=String(form.get("id")||""),accept=form.get("decision")==="accept";
  await query("UPDATE friendships SET status=$1,updated_at=now() WHERE id=$2 AND addressee_id=$3 AND status='PENDING'",[accept?"ACCEPTED":"DECLINED",id,user.id]);
  revalidatePath("/friends");redirect(`/friends?tab=requests&notice=${accept?"Friend%20added":"Request%20declined"}`);
}

export async function redeemOfferAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const offerId=String(form.get("offerId")||"");let error="";
  try{await transaction(async tx=>{const offer=(await tx.query("SELECT points_cost,active,expires_at FROM offers WHERE id=$1 FOR UPDATE",[offerId])).rows[0];const account=(await tx.query("SELECT xp FROM users WHERE id=$1 FOR UPDATE",[user.id])).rows[0];if(!offer||!offer.active||(offer.expires_at&&new Date(String(offer.expires_at))<new Date()))throw new Error("This reward is no longer available.");if(Number(account.xp)<Number(offer.points_cost))throw new Error("You need more points for this reward.");const exists=(await tx.query("SELECT id FROM reward_redemptions WHERE offer_id=$1 AND user_id=$2",[offerId,user.id])).rows[0];if(exists)throw new Error("You already redeemed this reward.");await tx.query("UPDATE users SET xp=xp-$1 WHERE id=$2",[offer.points_cost,user.id]);await tx.query("INSERT INTO reward_redemptions(id,offer_id,user_id,code,points_spent) VALUES($1,$2,$3,$4,$5)",[randomUUID(),offerId,user.id,`PU-${randomUUID().slice(0,8).toUpperCase()}`,offer.points_cost]);});}catch(e){error=errorText(e);}
  revalidatePath("/rewards");revalidatePath("/wallet");redirect(error?`/rewards?error=${encodeURIComponent(error)}`:"/wallet?notice=Reward%20added%20to%20your%20wallet");
}

export async function bookCourtAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const venueId=String(form.get("venueId")||"");let error="",reference="";
  try{const input=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^\d{2}:\d{2}$/),duration:z.coerce.number().refine(v=>[60,90,120].includes(v)),participants:z.coerce.number().int().min(1).max(30)}).parse({date:form.get("date"),time:form.get("time"),duration:form.get("duration"),participants:form.get("participants")});const start=DateTime.fromISO(`${input.date}T${input.time}`,{zone:"Asia/Amman"});if(!start.isValid||start.toMillis()<Date.now()+30*60*1000)throw new Error("Choose an available future time.");const end=start.plus({minutes:input.duration});await transaction(async tx=>{const venue=(await tx.query("SELECT hourly_rate_fils FROM venues WHERE id=$1 FOR UPDATE",[venueId])).rows[0];if(!venue)throw new Error("Venue not found.");const clash=(await tx.query("SELECT id FROM court_bookings WHERE venue_id=$1 AND status<>'CANCELLED' AND starts_at<$3 AND ends_at>$2 LIMIT 1",[venueId,start.toJSDate(),end.toJSDate()])).rows[0];if(clash)throw new Error("That time was just booked. Please choose another slot.");reference=`COURT-${randomUUID().slice(0,8).toUpperCase()}`;await tx.query("INSERT INTO court_bookings(id,reference,venue_id,user_id,starts_at,ends_at,amount_fils,participant_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),reference,venueId,user.id,start.toJSDate(),end.toJSDate(),Math.round(Number(venue.hourly_rate_fils)*input.duration/60),input.participants]);});}catch(e){error=errorText(e);}
  revalidatePath("/bookings");redirect(error?`/venues/${venueId}/book?error=${encodeURIComponent(error)}`:`/bookings?type=courts&notice=${encodeURIComponent(`Court booked. Reference ${reference}`)}`);
}

export async function cancelCourtBookingAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const id=String(form.get("bookingId")||""),reason=String(form.get("reason")||"Plans changed").trim().slice(0,300);
  await query("UPDATE court_bookings SET status='CANCELLED',cancellation_reason=$1 WHERE id=$2 AND user_id=$3 AND starts_at>now() AND status<>'CANCELLED'",[reason,id,user.id]);revalidatePath("/bookings");redirect("/bookings?type=courts&notice=Court%20booking%20cancelled");
}

export async function bookActivityAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const activityId=String(form.get("activityId")||"");let error="";
  try{const participants=z.coerce.number().int().min(1).max(8).parse(form.get("participants"));const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(form.get("date"));const activity=await one<{price_fils:number;capacity:number}>("SELECT price_fils,capacity FROM activities WHERE id=$1 AND active=TRUE",[activityId]);if(!activity)throw new Error("Activity not found.");const scheduled=DateTime.fromISO(`${date}T08:00`,{zone:"Asia/Amman"});if(scheduled.toMillis()<Date.now())throw new Error("Choose a future date.");await query("INSERT INTO activity_bookings(id,activity_id,user_id,scheduled_for,participants,amount_fils) VALUES($1,$2,$3,$4,$5,$6)",[randomUUID(),activityId,user.id,scheduled.toJSDate(),participants,activity.price_fils*participants]);}catch(e){error=errorText(e);}
  redirect(error?`/activities?error=${encodeURIComponent(error)}`:"/activities?notice=Adventure%20booked%20-%20pay%20at%20the%20meeting%20point");
}

export async function sendMatchMessageAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const gameId=String(form.get("gameId")||""),body=String(form.get("body")||"").trim();let error="";
  try{if(body.length<1||body.length>500)throw new Error("Write a message of up to 500 characters.");const access=await one("SELECT g.id FROM games g WHERE g.id=$1 AND (g.organizer_id=$2 OR EXISTS(SELECT 1 FROM bookings b WHERE b.game_id=g.id AND b.user_id=$2 AND b.status IN ('CONFIRMED','COMPLETED'))) ",[gameId,user.id]);if(!access)throw new Error("Join this match to use its chat.");await query("INSERT INTO match_messages(id,game_id,user_id,body) VALUES($1,$2,$3,$4)",[randomUUID(),gameId,user.id,body]);}catch(e){error=errorText(e);}
  revalidatePath(`/games/${gameId}/chat`);redirect(error?`/games/${gameId}/chat?error=${encodeURIComponent(error)}`:`/games/${gameId}/chat`);
}

export async function savePreferencesAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");const section=String(form.get("section"));
  if(section==="notifications")await query("UPDATE users SET notification_preferences=$1 WHERE id=$2",[JSON.stringify({booking:form.get("booking")==="on",matches:form.get("matches")==="on",rewards:form.get("rewards")==="on",community:form.get("community")==="on"}),user.id]);
  if(section==="privacy")await query("UPDATE users SET privacy_preferences=$1 WHERE id=$2",[JSON.stringify({profile:String(form.get("profile")||"public"),activity:form.get("activity")==="on",friendRequests:form.get("friendRequests")==="on"}),user.id]);
  redirect(`/settings/${section}?notice=Preferences%20saved`);
}

export async function supportTicketAction(form:FormData){
  const user=await currentUser();if(!user)redirect("/login");let error="";
  try{const input=z.object({category:z.string().min(2).max(80),body:z.string().trim().min(10).max(2000)}).parse({category:form.get("category"),body:form.get("body")});await query("INSERT INTO support_tickets(id,user_id,category,body) VALUES($1,$2,$3,$4)",[randomUUID(),user.id,input.category,input.body]);}catch(e){error=errorText(e);}
  redirect(error?`/support?error=${encodeURIComponent(error)}`:"/support?notice=Support%20ticket%20submitted");
}

export async function academyBookingAction(form:FormData){
  const access=await requireAcademyAccess();const id=String(form.get("bookingId")||""),command=z.enum(["CONFIRM","CHECK_IN","COMPLETE","CANCEL","COLLECT_CASH"]).parse(form.get("command"));let error="";
  try{await transaction(async tx=>{const booking=(await tx.query("SELECT b.*,v.academy_id FROM court_bookings b JOIN venues v ON v.id=b.venue_id WHERE b.id=$1 FOR UPDATE",[id])).rows[0];if(!booking||booking.academy_id!==access.academyId)throw new Error("Booking not found for your academy.");if(command==="CHECK_IN")await tx.query("UPDATE court_bookings SET checked_in_at=now(),status='CHECKED_IN' WHERE id=$1 AND status IN ('PENDING','CONFIRMED')",[id]);else if(command==="COLLECT_CASH")await tx.query("UPDATE court_bookings SET payment_status='PAID_CASH' WHERE id=$1",[id]);else if(command==="COMPLETE"){if(booking.payment_status!=="PAID_CASH")throw new Error("Record cash collection before completion.");await tx.query("UPDATE court_bookings SET status='COMPLETED' WHERE id=$1 AND status='CHECKED_IN'",[id]);}else await tx.query("UPDATE court_bookings SET status=$1 WHERE id=$2",[command==="CONFIRM"?"CONFIRMED":"CANCELLED",id]);await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,$3,'court_booking',$4)",[randomUUID(),access.userId,`ACADEMY_${command}`,id]);});}catch(e){error=errorText(e);}
  revalidatePath("/academy/bookings");redirect(error?`/academy/bookings?error=${encodeURIComponent(error)}`:`/academy/bookings?notice=${encodeURIComponent(command.replaceAll("_"," "))}%20saved`);
}

export async function academyOfferAction(form:FormData){
  const access=await requireAcademyAccess();let error="";
  try{const input=z.object({title:z.string().trim().min(4).max(100),description:z.string().trim().min(10).max(1000),points:z.coerce.number().int().min(0).max(100000)}).parse({title:form.get("title"),description:form.get("description"),points:form.get("points")});const academy=await one<{name:string}>("SELECT name FROM academies WHERE id=$1",[access.academyId]);await query("INSERT INTO offers(id,academy_id,title,partner,category,description,points_cost,expires_at) VALUES($1,$2,$3,$4,'Academy',$5,$6,now()+interval '180 days')",[randomUUID(),access.academyId,input.title,academy?.name||"Academy",input.description,input.points]);}catch(e){error=errorText(e);}
  revalidatePath("/academy/offers");revalidatePath("/rewards");redirect(error?`/academy/offers?error=${encodeURIComponent(error)}`:"/academy/offers?notice=Offer%20published");
}

export async function academyProfileAction(form:FormData){
  const access=await requireAcademyAccess();let error="";
  try{const input=z.object({name:z.string().trim().min(3).max(100),description:z.string().trim().min(20).max(2000),phone:z.string().trim().max(30),email:z.email()}).parse({name:form.get("name"),description:form.get("description"),phone:form.get("phone")||"",email:form.get("email")});await query("UPDATE academies SET name=$1,description=$2,phone=$3,email=$4 WHERE id=$5",[input.name,input.description,input.phone,input.email,access.academyId]);}catch(e){error=errorText(e);}
  revalidatePath("/academy");redirect(error?`/academy/profile?error=${encodeURIComponent(error)}`:"/academy/profile?notice=Academy%20profile%20updated");
}

/* ---------- Admin catalogue management (venues, academies, activities) ---------- */
async function requirePlatformAdmin(){const user=await currentUser();if(!user)redirect("/login");if(!["ADMIN","SUPER_ADMIN"].includes(user.role))redirect("/admin");return user;}
const list=(v:FormDataEntryValue|null)=>String(v||"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,30);
const text=(v:FormDataEntryValue|null,max=2000)=>String(v||"").trim().slice(0,max);
const imageOf=(f:FormData)=>String(f.get("imagePreset")||f.get("imageUrl")||"");
const imageField=(v:string)=>{const u=v.trim();if(/^\/images\/[\w.-]+$/.test(u)||/^https:\/\/images\.unsplash\.com\//.test(u))return u;throw new Error("Choose a PlayUp image or paste an images.unsplash.com link.");};
const jd=(v:FormDataEntryValue|null)=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error("Enter a valid price in JD.");return Math.round(n*1000);};
const num=(v:FormDataEntryValue|null)=>{const s=String(v||"").trim();if(!s)return null;const n=Number(s);if(!Number.isFinite(n))throw new Error("Enter valid coordinates.");return n;};
function adminDone(path:string,error:string,notice:string){redirect(error?`${path}?error=${encodeURIComponent(error)}`:`${path}?notice=${encodeURIComponent(notice)}`);}

export async function saveActivityAction(form:FormData){let error="";try{const user=await requirePlatformAdmin();const id=text(form.get("id"),60)||randomUUID();
  const title=text(form.get("title"),120),area=text(form.get("area"),120),category=text(form.get("category"),40),description=text(form.get("description"));
  if(title.length<3||area.length<2||category.length<2||description.length<10)throw new Error("Title, category, location and a description are required.");
  const row=[id,title,category,area,description,imageField(imageOf(form)),jd(form.get("price")),Math.max(15,Math.round(Number(form.get("duration"))||120)),text(form.get("difficulty"),40)||"All levels",Math.max(1,Math.round(Number(form.get("capacity"))||10)),text(form.get("operatorName"),120),text(form.get("operatorPhone"),40)||null,text(form.get("badge"),40),list(form.get("includes")),text(form.get("priceUnit"),30)||"person"];
  await query(`INSERT INTO activities(id,title,category,area,description,image_url,price_fils,duration_minutes,difficulty,capacity,operator_name,operator_phone,badge,includes,price_unit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
   ON CONFLICT(id) DO UPDATE SET title=$2,category=$3,area=$4,description=$5,image_url=$6,price_fils=$7,duration_minutes=$8,difficulty=$9,capacity=$10,operator_name=$11,operator_phone=$12,badge=$13,includes=$14,price_unit=$15`,row);
  await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,'ACTIVITY_SAVED','activity',$3)",[randomUUID(),user.id,id]);revalidatePath("/activities");}catch(e){error=errorText(e);}adminDone("/admin/activities",error,"Activity saved");}

export async function saveAcademyAction(form:FormData){let error="";try{const user=await requirePlatformAdmin();const id=text(form.get("id"),60)||randomUUID();
  const name=text(form.get("name"),120),area=text(form.get("area"),120),address=text(form.get("address"),200);
  if(name.length<3||area.length<2||address.length<3)throw new Error("Name, area and address are required.");
  await query(`INSERT INTO academies(id,name,area,address,description,sports,image_url,rating,verified,phone,email,website,training_packages,featured,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
   ON CONFLICT(id) DO UPDATE SET name=$2,area=$3,address=$4,description=$5,sports=$6,image_url=$7,verified=$9,phone=$10,email=$11,website=$12,training_packages=$13,featured=$14,latitude=$15,longitude=$16`,
   [id,name,area,address,text(form.get("description")),list(form.get("sports")).map(s=>s.toLowerCase()),imageField(imageOf(form)),0,form.get("verified")==="on",text(form.get("phone"),40)||null,text(form.get("email"),120)||null,text(form.get("website"),200)||null,list(form.get("packages")),form.get("featured")==="on",num(form.get("latitude")),num(form.get("longitude"))]);
  await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,'ACADEMY_SAVED','academy',$3)",[randomUUID(),user.id,id]);revalidatePath("/academies");}catch(e){error=errorText(e);}adminDone("/admin/academies",error,"Academy saved");}

export async function saveVenueAction(form:FormData){let error="";try{const user=await requirePlatformAdmin();const id=text(form.get("id"),60)||randomUUID();
  const name=text(form.get("name"),120),area=text(form.get("area"),120),address=text(form.get("address"),200),sports=list(form.get("sports")).map(s=>s.toLowerCase());
  if(name.length<3||area.length<2||address.length<3||!sports.length)throw new Error("Name, area, address and at least one sport are required.");
  const academy=text(form.get("academyId"),60)||null;
  await query(`INSERT INTO venues(id,name,area,address,sports,amenities,image_url,latitude,longitude,rating,demo,academy_id,hourly_rate_fils) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,0,FALSE,$10,$11)
   ON CONFLICT(id) DO UPDATE SET name=$2,area=$3,address=$4,sports=$5,amenities=$6,image_url=$7,latitude=$8,longitude=$9,demo=FALSE,academy_id=$10,hourly_rate_fils=$11`,
   [id,name,area,address,sports,list(form.get("amenities")),imageField(imageOf(form)),num(form.get("latitude")),num(form.get("longitude")),academy,jd(form.get("hourlyRate"))]);
  await query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES($1,$2,'VENUE_SAVED','venue',$3)",[randomUUID(),user.id,id]);revalidatePath("/venues");}catch(e){error=errorText(e);}adminDone("/admin/venues",error,"Venue saved");}

export async function setCatalogueActiveAction(form:FormData){let error="";const table=String(form.get("table")),id=String(form.get("id")),next=form.get("active")==="1";try{await requirePlatformAdmin();if(!["activities","academies","venues"].includes(table))throw new Error("Unknown item.");await query(`UPDATE ${table} SET active=$1 WHERE id=$2`,[next,id]);revalidatePath(`/${table==="activities"?"activities":table}`);}catch(e){error=errorText(e);}adminDone(`/admin/${table}`,error,next?"Item is live":"Item hidden from the public site");}
