"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="page"><div className="container empty"><h1>Games are unavailable</h1><p>Please try again in a moment.</p><button className="btn btn-primary" onClick={reset}>Try again</button></div></main>}
