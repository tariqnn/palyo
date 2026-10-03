import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { heroImage } from "@/lib/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isLocale, localeCookie } from "@/lib/i18n";
export async function AuthShell({children,signup=false}:{children:React.ReactNode;signup?:boolean}){const stored=(await cookies()).get(localeCookie)?.value;const locale=isLocale(stored)?stored:"en";return <main className={`auth-layout ${signup?"auth-signup":"auth-login"}`}><div className="auth-photo"><Image src={heroImage} alt="People playing football" fill priority sizes="50vw"/><div className="auth-photo-content"><h2>{signup?"Your next game is waiting.":"Join the community."}</h2><p>{signup?"Meet the players who make every game better.":"Play more sports. Meet more people. Stay active."}</p></div></div><div className="auth-form-side"><div className="auth-topbar"><Link className="logo auth-logo" href="/">PlayUp</Link><LanguageSwitcher locale={locale}/></div><div className="auth-box">{children}</div></div></main>}
