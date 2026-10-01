import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { brand } from "@/lib/brand";
import { demoEnabled, publicDemoEnabled } from "@/lib/demo";
import "./globals.css";
const geist=Geist({subsets:["latin"]});
export const dynamic="force-dynamic";
export const metadata:Metadata={
  metadataBase:new URL(brand.url),
  title:{default:`${brand.name} | Find your game`,template:`%s | ${brand.name}`},
  description:brand.description,
  applicationName:brand.name,
  alternates:{canonical:"/"},
  openGraph:{title:`${brand.name} | Find your game`,description:brand.description,type:"website",url:"/",siteName:brand.name,locale:"en_JO"},
  twitter:{card:"summary_large_image",title:`${brand.name} | Find your game`,description:brand.description},
  robots:{index:true,follow:true},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={geist.className}><Header/>{demoEnabled()&&<div className="demo-banner">{publicDemoEnabled()?"Public demo":"Private demo"} · Bookings use simulated payments. No real charge is made.</div>}{children}<Footer/></body></html>}
