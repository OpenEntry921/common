"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { PageHead } from "@/components/UI";

const stats=[["2,418","방문자","+12%"],["816","재방문자","33.7%"],["48","도움 요청","이번 달"],["31","도움 연결","연결률 65%"],["126","프로그램 신청","6개 프로그램"],["39","재능기부","+8명"],["27","기도 요청","내용 비공개"],["14","사람 연결 요청","내용 비공개"]];
type AiStatus={configured:boolean;status:"connected"|"not_configured"|"unauthorized"};

export default function Page(){
  const [pin,setPin]=useState(""); const [unlocked,setUnlocked]=useState(false); const [authError,setAuthError]=useState("");
  const [aiStatus,setAiStatus]=useState<AiStatus|null>(null);

  async function unlock(e:FormEvent){
    e.preventDefault();setAuthError("");
    const r=await fetch("/api/admin/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin})});
    if(r.ok){
      setUnlocked(true);
      const statusResponse=await fetch("/api/admin/ai-status",{headers:{"x-common-admin-pin":pin}});
      const status:AiStatus=await statusResponse.json().catch(()=>({configured:false,status:"not_configured"}));
      setAiStatus(statusResponse.ok?status:{configured:false,status:"not_configured"});
    }else setAuthError("관리자 PIN을 확인해주세요.");
  }
  if(!unlocked)return <><PageHead eyebrow="ADMIN DEMO" title="관리자 페이지" desc="관리자 PIN을 입력해주세요."/><section className="section"><form className="container card admin-gate form" onSubmit={unlock}><LockKeyhole/><div className="field"><label htmlFor="admin-pin">Admin PIN</label><input id="admin-pin" type="password" required value={pin} onChange={e=>setPin(e.target.value)} autoComplete="current-password"/></div>{authError&&<p className="notice">{authError}</p>}<button className="button">관리자 페이지 열기</button><small>Prototype용 접근 제한입니다. Production에서는 실제 관리자 인증으로 교체해야 합니다.</small></form></section></>;
  const connected=aiStatus?.configured===true;
  return <><PageHead eyebrow="ADMIN DEMO" title="이번 달 COMMON" desc="민감한 개인 내용 없이, 지역사회와 만든 연결을 익명화된 숫자로 살펴봅니다."/><section className="section"><div className="container"><section className="card ai-admin-card"><p className="eyebrow">AI 마음편지</p><h2>AI 마음편지</h2><p className={`connection-status ${connected?"on":""}`} role="status" aria-live="polite">● {connected?"AI 서비스 정상":"AI 서비스 설정 필요"}</p>{connected?<p><strong><CheckCircle2 size={18}/> OpenAI 연결이 정상적으로 설정되어 있습니다.</strong><br/><small>COMMON에서 실제 AI 마음편지를 사용할 수 있습니다.</small></p>:<p>OpenAI API 설정을 확인해주세요.</p>}<div className="inline-actions"><Link className="button" href="/heart/letter">마음편지 확인</Link></div><p className="billing-note">OpenAI API 사용량은 ChatGPT 구독과 별도로 OpenAI API 계정에 과금됩니다.</p></section><span className="demo-label">DEMO DASHBOARD · 실제 운영 데이터가 아닙니다</span><div className="grid admin-grid" style={{marginTop:24}}>{stats.map(([n,l,x])=><article className="card admin-card" key={l}><small>{l}</small><b>{n}</b><small>{x}</small></article>)}</div><div style={{textAlign:"center",marginTop:70}}><Link href="/impact" className="button">Community Impact 보기</Link> <Link href="/" className="button secondary">사용자 화면 보기</Link></div></div></section></>;
}
