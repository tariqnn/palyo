import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { brand } from "@/lib/brand";
import { privateDemoEnabled } from "@/lib/demo";
import "./globals.css";
const geist=Geist({subsets:["latin"]});
export const dynamic="force-dynamic";
export const metadata:Metadata={title:{default:`${brand.name} | Find your game`,template:`%s | ${brand.name}`},description:brand.description,openGraph:{title:brand.name,description:brand.description,type:"website"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={geist.className}><Header/>{privateDemoEnabled()&&<div className="demo-banner">Private demo · Bookings use simulated payments. No real charge is made.</div>}{children}<Footer/></body></html>}
