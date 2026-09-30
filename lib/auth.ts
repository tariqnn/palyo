import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { one, query, transaction } from "@/lib/db";
import { z } from "zod";
import { sendResetEmail } from "@/lib/email";
import { brand } from "@/lib/brand";

export type User = { id:string; name:string; username:string; email:string; role:string; avatar_url:string|null; xp:number; city:string };
const tokenHash = (token:string) => createHash("sha256").update(token).digest("hex");
export const signupSchema = z.object({
  name:z.string().trim().min(2).max(80), username:z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/),
  email:z.email().toLowerCase(), phone:z.string().max(30).optional(),
  password:z.string().min(10).max(100), confirm:z.string(), terms:z.literal("on")
}).refine(v=>v.password===v.confirm,{message:"Passwords do not match",path:["confirm"]});

export async function currentUser():Promise<User|null> {
  const token=(await cookies()).get("playo_session")?.value;
  if(!token) return null;
  return one<User>("SELECT u.id,u.name,u.username,u.email,u.role,u.avatar_url,u.xp,u.city FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",[tokenHash(token)]);
}
export async function requireUser():Promise<User> { const user=await currentUser(); if(!user) throw new Error("Please log in first."); return user; }
export async function requireManager(gameId?:string):Promise<User> {
  const user=await requireUser();
  if(["ADMIN","SUPER_ADMIN"].includes(user.role)) return user;
  if(gameId) {
    const allowed=await one("SELECT id FROM games WHERE id=$1 AND (organizer_id=$2 OR scorekeeper_id=$2)",[gameId,user.id]);
    if(allowed) return user;
  }
  throw new Error("You are not authorized for this game.");
}
export async function createSession(userId:string) {
  const token=randomBytes(32).toString("base64url");
  await query("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 days')",[randomUUID(),userId,tokenHash(token)]);
  (await cookies()).set("playo_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
}
export async function signOut(){ const jar=await cookies(); const token=jar.get("playo_session")?.value; if(token) await query("DELETE FROM sessions WHERE token_hash=$1",[tokenHash(token)]); jar.delete("playo_session"); }
export async function login(email:string,password:string){
  const clean=email.trim().toLowerCase();
  const attempts=await one<{n:string}>("SELECT count(*)::text AS n FROM login_attempts WHERE email=$1 AND created_at>now()-interval '15 minutes'",[clean]);
  if(Number(attempts?.n||0)>=5)throw new Error("Too many attempts. Please try again in 15 minutes.");
  const user=await one<{id:string;password_hash:string}>("SELECT id,password_hash FROM users WHERE email=$1",[clean]);
  if(!user||!(await compare(password,user.password_hash))){await query("INSERT INTO login_attempts(id,email) VALUES($1,$2)",[randomUUID(),clean]);throw new Error("Incorrect email or password.");}
  await query("DELETE FROM login_attempts WHERE email=$1",[clean]);
  await createSession(user.id);
}
export async function signup(input:unknown){
  const parsed=signupSchema.parse(input);
  const exists=await one("SELECT id FROM users WHERE email=$1 OR username=$2",[parsed.email,parsed.username]);
  if(exists) throw new Error("Email or username is already in use.");
  const id=randomUUID();
  await query("INSERT INTO users(id,name,username,email,phone,password_hash) VALUES($1,$2,$3,$4,$5,$6)",[id,parsed.name,parsed.username,parsed.email,parsed.phone||null,await hash(parsed.password,12)]);
  await createSession(id); return id;
}
export async function requestPasswordReset(email:string){
  const clean=z.email().parse(email.trim().toLowerCase());
  const user=await one<{id:string}>("SELECT id FROM users WHERE email=$1",[clean]);
  if(!user)return null;
  const recent=await one<{n:string}>("SELECT count(*)::text AS n FROM password_resets WHERE user_id=$1 AND created_at>now()-interval '15 minutes'",[user.id]);
  if(Number(recent?.n||0)>=3)throw new Error("Please wait before requesting another reset link.");
  const token=randomBytes(32).toString("base64url"),url=`${brand.url}/reset-password/${token}`;
  await query("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",[randomUUID(),user.id,tokenHash(token)]);
  await sendResetEmail(clean,url);
  return process.env.NODE_ENV==="production"?null:url;
}
export async function resetPassword(token:string,password:string){
  if(password.length<10||password.length>100)throw new Error("Use a password of at least 10 characters.");
  await transaction(async tx=>{
    const row=(await tx.query("SELECT user_id FROM password_resets WHERE token_hash=$1 AND expires_at>now() FOR UPDATE",[tokenHash(token)])).rows[0];
    if(!row)throw new Error("This reset link is invalid or expired.");
    await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2",[await hash(password,12),row.user_id]);
    await tx.query("DELETE FROM sessions WHERE user_id=$1",[row.user_id]);
    await tx.query("DELETE FROM password_resets WHERE user_id=$1",[row.user_id]);
  });
}
