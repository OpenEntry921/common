"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CircleDot, Heart, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { SITE_CONFIG } from "@/lib/config";

const nav = [
  { href: "/", label: "홈", icon: Home, matches: ["/"] },
  { href: "/community", label: "함께하기", icon: CalendarDays, matches: ["/community", "/connect"] },
  { href: "/space", label: "공간", icon: CircleDot, matches: ["/space", "/table"] },
  { href: "/heart", label: "마음", icon: Heart, matches: ["/heart", "/prayer", "/talk"] },
];

const isCurrent = (path: string, matches: string[]) =>
  matches.some((route) => route === "/" ? path === route : path === route || path.startsWith(`${route}/`));

export function AppShell({children}:{children:React.ReactNode}) {
 const path=usePathname(); const [open,setOpen]=useState(false); const minimal=path==="/qr-demo";
 return <><header className={`header ${minimal?"header-minimal":""}`}><Link className="brand" href="/"><b>{SITE_CONFIG.serviceName}</b><small>{SITE_CONFIG.tagline}</small></Link>
 {!minimal&&<><nav className="desktop-nav" aria-label="주요 메뉴">{nav.map(n=>{const active=isCurrent(path,n.matches);return <Link className={active?"active":""} aria-current={active?"page":undefined} key={n.href} href={n.href}>{n.label}</Link>})}<button className="icon-button" aria-label="전체 메뉴 열기" onClick={()=>setOpen(true)}><Menu size={20}/></button></nav><button className="mobile-menu" aria-label="전체 메뉴 열기" onClick={()=>setOpen(true)}><Menu/></button></>}</header>
 <main className={minimal?"minimal-main":""}>{children}</main>
 {!minimal&&<><footer><div><Link className="brand footer-brand" href="/"><b>{SITE_CONFIG.serviceName}</b><small>{SITE_CONFIG.tagline}</small></Link><p>서로의 일상에 작은 도움이 되는 동네 커뮤니티</p></div><div className="footer-links"><Link href="/impact">Community Impact</Link><Link href="/privacy">개인정보와 신뢰</Link><Link href="/church">이 공간을 운영하는 곳</Link><a href={SITE_CONFIG.churchUrl} target="_blank" rel="noreferrer">{SITE_CONFIG.churchName} 알아보기 ↗</a><Link href="/admin-demo">Admin Demo</Link></div><small>Hosted by <a className="church-link" href={SITE_CONFIG.churchUrl} target="_blank" rel="noreferrer">{SITE_CONFIG.churchName}</a></small></footer>
 <nav className="bottom-nav" aria-label="주요 메뉴">{nav.map(n=>{const Icon=n.icon;const active=isCurrent(path,n.matches);return <Link className={active?"active":""} aria-current={active?"page":undefined} key={n.href} href={n.href}><Icon aria-hidden="true"/><span>{n.label}</span></Link>})}</nav></>}
 {open&&<div className="drawer-backdrop" onClick={()=>setOpen(false)}><aside className="drawer" role="dialog" aria-modal="true" aria-label="전체 메뉴" onClick={e=>e.stopPropagation()}><button className="drawer-close" onClick={()=>setOpen(false)} aria-label="전체 메뉴 닫기"><X/></button><p className="eyebrow">EXPLORE COMMON</p>{nav.map(n=><Link key={n.href} href={n.href} onClick={()=>setOpen(false)}>{n.label}<span>→</span></Link>)}<hr/><Link href="/space" onClick={()=>setOpen(false)}>COMMON SPACE<span>→</span></Link><Link href="/table" onClick={()=>setOpen(false)}>COMMON TABLE<span>→</span></Link><Link href="/connect" onClick={()=>setOpen(false)}>COMMON CONNECT<span>→</span></Link><Link href="/circle" onClick={()=>setOpen(false)}>COMMON CIRCLE<span>→</span></Link><Link href="/impact" onClick={()=>setOpen(false)}>함께 만든 변화<span>→</span></Link><Link href="/church" onClick={()=>setOpen(false)}>이 공간을 운영하는 곳<span>→</span></Link><a href={SITE_CONFIG.churchUrl} target="_blank" rel="noreferrer" onClick={()=>setOpen(false)}>{SITE_CONFIG.churchName} 알아보기<span>↗</span></a><Link href="/privacy" onClick={()=>setOpen(false)}>개인정보와 신뢰<span>→</span></Link></aside></div>}
 </>;
}
