import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame,gameDate } from "@/lib/data";
import { getScore,scoreEvents } from "@/lib/competition";
import { getGameClock } from "@/lib/clock";
import { LiveScore } from "./live-score";
export const dynamic="force-dynamic";
export default async function ScorePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const game=await getGame(id);if(!game)notFound();const [score,events,clock]=await Promise.all([getScore(id,game.sport,game.score_config),scoreEvents(id),getGameClock(id)]);return <main className="page"><div className="container"><div className="breadcrumb"><Link href={`/games/${id}`}>{game.title}</Link> / Live score</div><div className="page-head"><h1>{game.title} <span className="badge badge-green">{game.status==="COMPLETED"?"Final":"Live score"}</span></h1><p>{game.venue_name} · {gameDate(game.starts_at)}</p></div><LiveScore id={id} initialScore={score} initialEvents={events} initialClock={clock}/></div></main>}
