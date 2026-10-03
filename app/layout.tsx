import type { Metadata } from "next";
import { Geist, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LocaleController } from "@/components/locale-controller";
import { brand } from "@/lib/brand";
import { isLocale, localeCookie } from "@/lib/i18n";
import "./globals.css";
const geist=Geist({subsets:["latin"]});
const notoArabic=Noto_Sans_Arabic({subsets:["arabic"],variable:"--font-arabic",display:"swap"});
export const dynamic="force-dynamic";
async function activeLocale(){const value=(await cookies()).get(localeCookie)?.value;return isLocale(value)?value:"en";}
export async function generateMetadata():Promise<Metadata>{
  const locale=await activeLocale();
  const title=locale==="ar"?`${brand.name} | اعثر على لعبتك`:`${brand.name} | Find your game`;
  const description=locale==="ar"?"اعثر على مباريات رياضية وملاعب ولاعبين في عمّان وانضم إليهم.":brand.description;
  return {
    metadataBase:new URL(brand.url),title:{default:title,template:`%s | ${brand.name}`},description,applicationName:brand.name,
    alternates:{canonical:"/"},openGraph:{title,description,type:"website",url:"/",siteName:brand.name,locale:locale==="ar"?"ar_JO":"en_JO",alternateLocale:locale==="ar"?["en_JO"]:["ar_JO"]},
    twitter:{card:"summary_large_image",title,description},robots:{index:true,follow:true},
  };
}
export default async function RootLayout({children}:{children:React.ReactNode}){const locale=await activeLocale();return <html lang={locale} dir={locale==="ar"?"rtl":"ltr"} suppressHydrationWarning><body className={`${geist.className} ${notoArabic.variable}`} data-locale={locale}><LocaleController locale={locale}/><Header locale={locale}/>{children}<Footer/><Analytics/><SpeedInsights/></body></html>}
