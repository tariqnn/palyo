import "server-only";
import { randomUUID } from "node:crypto";
import { one,query,transaction } from "@/lib/db";
import { demoEnabled } from "./demo";
export type Visibility="PUBLIC"|"PARTICIPANTS_ONLY"|"UNLISTED"|"PRIVATE";
export interface StreamingProvider {
  createStream(gameId:string):Promise<{providerId:string;serverUrl:string;streamKey:string}>;
  getStatus(providerId:string):Promise<"SCHEDULED"|"LIVE"|"ENDED">;
  endStream(providerId:string):Promise<void>;
  getPlayback(providerId:string):Promise<string|null>;
  getRecording(providerId:string):Promise<{providerId:string;playbackUrl:string|null}|null>;
  deleteRecording(providerId:string):Promise<void>;
}
const mockProvider:StreamingProvider={
  async createStream(gameId){return {providerId:`mock_${gameId}`,serverUrl:"rtmp://localhost/preview-only",streamKey:randomUUID()};},
  async getStatus(){return "SCHEDULED";}, async endStream(){}, async getPlayback(){return null;},
  async getRecording(){return null;}, async deleteRecording(){},
};
export function streamingProvider():StreamingProvider {if(process.env.STREAM_PROVIDER&&process.env.STREAM_PROVIDER!=="mock")throw new Error("Live streaming is not enabled yet.");if(process.env.NODE_ENV==="production"&&!demoEnabled())throw new Error("Live streaming is not enabled yet.");return mockProvider;}
export async function createGameStream(gameId:string,visibility:Visibility){
  const existing=await one("SELECT id FROM streams WHERE game_id=$1",[gameId]);if(existing)throw new Error("This game already has a stream.");
  const provider=await streamingProvider().createStream(gameId),id=randomUUID();
  await query("INSERT INTO streams(id,game_id,provider,provider_id,status,visibility,secret_key) VALUES($1,$2,'mock',$3,'SCHEDULED',$4,$5)",[id,gameId,provider.providerId,visibility,provider.streamKey]);
  return {id,serverUrl:provider.serverUrl,streamKey:provider.streamKey};
}
export async function endGameStream(gameId:string){
  return transaction(async tx=>{
    const stream=(await tx.query("SELECT * FROM streams WHERE game_id=$1 FOR UPDATE",[gameId])).rows[0];if(!stream)throw new Error("Stream not found.");
    if(stream.status==="ENDED")return;
    await streamingProvider().endStream(String(stream.provider_id));
    await tx.query("UPDATE streams SET status='ENDED',ended_at=now() WHERE id=$1",[stream.id]);
    const game=(await tx.query("SELECT recording_enabled,recording_visibility FROM games WHERE id=$1",[gameId])).rows[0];
    if(game?.recording_enabled) await tx.query("INSERT INTO recordings(id,game_id,stream_id,status,visibility) VALUES($1,$2,$3,'PROCESSING',$4)",[randomUUID(),gameId,stream.id,game.recording_visibility]);
  });
}
export async function canWatch(visibility:Visibility,gameId:string,userId?:string){
  if(visibility==="PUBLIC"||visibility==="UNLISTED")return true;
  if(!userId)return false;
  const allowed=await one(`SELECT g.id FROM games g WHERE g.id=$1 AND (g.organizer_id=$2 ${visibility==="PARTICIPANTS_ONLY"?"OR g.scorekeeper_id=$2 OR EXISTS(SELECT 1 FROM bookings b WHERE b.game_id=g.id AND b.user_id=$2 AND b.status IN ('CONFIRMED','COMPLETED'))":""})`,[gameId,userId]);
  if(allowed)return true;
  const admin=await one("SELECT id FROM users WHERE id=$1 AND role IN ('ADMIN','SUPER_ADMIN')",[userId]);
  return !!admin;
}
