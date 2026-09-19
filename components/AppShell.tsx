"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, HandHeart, Heart, Home, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { SITE_CONFIG } from "@/lib/config";

const nav = [{href:"/",label:"Home",icon:Home},{href:"/give-ask",label:"Give & Ask",icon:HandHeart},{href:"/community",label:"COMMON",icon:Coffee},{href:"/heart",label:"마음",icon:Heart},{href:"/my",label:"MY",icon:UserRound}];
export function AppShell({children}:{children:React.ReactNode}) {
 const path=usePathname(); const [open,setOpen]=useState(false); const minimal=path==="/qr-demo";
 return <><header className={`header ${minimal?"header-minimal":""}`}><Link className="brand" href="/"><b>COMMON</b><small>Coffee · Community · Care</small></Link>
 {!minimal&&<><nav className="desktop-nav">{nav.map(n=><Link className={path===n.href?"active":""} key={n.href} href={n.href}>{n.label}</Link>)}<button className="icon-button" aria-label="전체 메뉴" onClick={()=>setOpen(true)}><Menu size={20}/></button></nav><button className="mobile-menu" aria-label="전체 메뉴" onClick={()=>setOpen(true)}><Menu/></button></>}</header>
 <main className={minimal?"minimal-main":""}>{children}</main>
 {!minimal&&<><footer><div><Link className="brand footer-brand" href="/"><b>COMMON</b><small>Coffee · Community · Care</small></Link><p>서로의 일상에 작은 도움이 되는 동네 커뮤니티</p></div><div className="footer-links"><Link href="/impact">Community Impact</Link><Link href="/privacy">개인정보와 신뢰</Link><Link href="/church">이 공간을 운영하는 곳</Link><Link href="/admin-demo">Admin Demo</Link></div><small>Hosted by {SITE_CONFIG.churchName} · Prototype, 2026</small></footer>
 <nav className="bottom-nav">{nav.map(n=>{const Icon=n.icon;return <Link className={path===n.href?"active":""} key={n.href} href={n.href}><Icon/><span>{n.label}</span></Link>})}</nav></>}
 {open&&<div className="drawer-backdrop" onClick={()=>setOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="drawer-close" onClick={()=>setOpen(false)} aria-label="닫기"><X/></button><p className="eyebrow">EXPLORE COMMON</p>{nav.map(n=><Link key={n.href} href={n.href} onClick={()=>setOpen(false)}>{n.label}<span>→</span></Link>)}<hr/><Link href="/market" onClick={()=>setOpen(false)}>나눔 장터<span>→</span></Link><Link href="/impact" onClick={()=>setOpen(false)}>Community Impact<span>→</span></Link><Link href="/church" onClick={()=>setOpen(false)}>이 공간을 운영하는 곳<span>→</span></Link><Link href="/privacy" onClick={()=>setOpen(false)}>개인정보와 신뢰<span>→</span></Link></aside></div>}
 </>;
}
