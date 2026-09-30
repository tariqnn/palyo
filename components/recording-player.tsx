"use client";
import { useRef } from "react";

type Moment={id:string;timestamp_seconds:number;title:string};
export function RecordingPlayer({src,moments}:{src:string;moments:Moment[]}){
  const video=useRef<HTMLVideoElement>(null);
  function seek(seconds:number){if(!video.current)return;video.current.currentTime=seconds;void video.current.play();video.current.scrollIntoView({behavior:"smooth",block:"center"});}
  return <>
    <video ref={video} controls playsInline style={{width:"100%",background:"#000"}} src={src}/>
    <h2>Moments</h2>
    {moments.length?<div className="card" style={{padding:14}}>{moments.map(m=><button className="text-button" style={{display:"block",padding:"8px 0",textAlign:"left"}} onClick={()=>seek(m.timestamp_seconds)} key={m.id} type="button"><strong>{Math.floor(m.timestamp_seconds/60)}:{String(m.timestamp_seconds%60).padStart(2,"0")}</strong> · {m.title}</button>)}</div>:<p className="muted">No moments tagged yet.</p>}
  </>;
}
