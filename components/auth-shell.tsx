import Image from "next/image";
import Link from "next/link";
import { heroImage } from "@/lib/brand";
export function AuthShell({children,signup=false}:{children:React.ReactNode;signup?:boolean}){return <main className={`auth-layout ${signup?"auth-signup":"auth-login"}`}><div className="auth-photo"><Image src={heroImage} alt="People playing football" fill priority sizes="50vw"/><div className="auth-photo-content"><h2>{signup?"Your next game is waiting.":"Join the community."}</h2><p>{signup?"Meet the players who make every game better.":"Play more sports. Meet more people. Stay active."}</p></div></div><div className="auth-form-side"><Link className="logo auth-logo" href="/">PLAYO</Link><div className="auth-box">{children}</div></div></main>}
