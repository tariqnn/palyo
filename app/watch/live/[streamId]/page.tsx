import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { one } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canWatch,type Visibility } from "@/lib/streaming";
import { getGame } from "@/lib/data";
import { getScore } from "@/lib/competition";
type S={id:string;game_id:string;status:string;visibility:Visibility;playback_url:string|null};
export default async function LiveViewer({params}:{params:Promise<{streamId:string}>}){const {streamId}=await params;const stream=await one<S>("SELECT * FROM streams WHERE id=$1",[streamId]);if(!stream)notFound();const user=await currentUser();if(!(await canWatch(stream.visibility,stream.game_id,user?.id)))return <main className="page container"><div className="empty"><h3>This stream is private</h3><p>Only approved players can watch.</p></div></main>;const game=await getGame(stream.game_id);if(!game)notFound();const score=await getScore(game.id,game.sport,game.score_config);return <main className="page"><div className="container"><div className="page-head"><span className="badge badge-green">{stream.status}</span><h1>{game.title}</h1><p>{game.venue_name}</p></div>{stream.playback_url?<video controls playsInline style={{width:"100%",background:"#000"}} src={stream.playback_url}/>:<div className="video-placeholder"><div><Play size={34}/><strong>Video is not available</strong><p>Connect a streaming provider to enable live playback.</p></div></div>}<div className="scoreboard" style={{marginTop:15}}><div><div className="score-team">BLACK</div><div className="score-number">{score.black}</div></div><div className="score-mid">{score.label}</div><div><div className="score-team">WHITE</div><div className="score-number">{score.white}</div></div></div><p><Link className="inline-link" href={`/games/${game.id}/score`}>Live scoreboard →</Link> · <Link className="inline-link" href={`/games/${game.id}`}>Game details →</Link></p></div></main>}
