import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { one,query } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canWatch,type Visibility } from "@/lib/streaming";
import { getGame } from "@/lib/data";
import { RecordingPlayer } from "@/components/recording-player";

type RecordingRow={id:string;game_id:string;status:string;visibility:Visibility;playback_url:string|null};
type Moment={id:string;timestamp_seconds:number;title:string};

export default async function Recording({params}:{params:Promise<{recordingId:string}>}){
  const {recordingId}=await params;
  const recording=await one<RecordingRow>("SELECT * FROM recordings WHERE id=$1",[recordingId]);
  if(!recording)notFound();
  const user=await currentUser();
  if(!(await canWatch(recording.visibility,recording.game_id,user?.id)))return <main className="page container"><div className="empty"><h3>This recording is private</h3></div></main>;
  const game=await getGame(recording.game_id);if(!game)notFound();
  const moments=await query<Moment>("SELECT id,timestamp_seconds,title FROM video_moments WHERE recording_id=$1 ORDER BY timestamp_seconds",[recording.id]);
  return <main className="page"><div className="container">
    <div className="page-head"><h1>{game.title}</h1><p>{game.venue_name} · Recording {recording.status.toLowerCase()}</p></div>
    {recording.status==="READY"&&recording.playback_url?<RecordingPlayer src={recording.playback_url} moments={moments}/>:<><div className="video-placeholder"><div><Play size={34}/><strong>{recording.status==="PROCESSING"?"Recording is processing":"Video unavailable"}</strong><p>Playback will appear here when the provider supplies a ready recording.</p></div></div><h2>Moments</h2>{moments.length?moments.map(m=><p key={m.id}>{Math.floor(m.timestamp_seconds/60)}:{String(m.timestamp_seconds%60).padStart(2,"0")} · {m.title}</p>):<p className="muted">No moments tagged yet.</p>}</>}
    <p><Link className="inline-link" href={`/games/${game.id}`}>Game details →</Link></p>
  </div></main>;
}
