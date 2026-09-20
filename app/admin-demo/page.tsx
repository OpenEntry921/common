"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { PageHead } from "@/components/UI";
import { SITE_CONFIG } from "@/lib/config";

const stats=[["2,418","방문자","+12%"],["816","재방문자","33.7%"],["48","도움 요청","이번 달"],["31","도움 연결","연결률 65%"],["126","프로그램 신청","6개 프로그램"],["39","재능기부","+8명"],["27","기도 요청","내용 비공개"],["14","사람 연결 요청","내용 비공개"]];
type SafeError={status?:number;code:string;type?:string;param?:string};
type AiStatus={
  configured:boolean;
  openaiConnection?:"ok"|"error"|"not_configured";
  structuredAI?:"ok"|"error"|"not_configured"|"not_tested";
  heartLetter?:"live"|"fallback"|"demo";
  mode?:"live"|"fallback"|"demo";
  model?:string;
  error?:SafeError|null;
  attempts?:number;
  recovered?:boolean;
  prayerEmail?:{configured:boolean;recipient:string};
};

export default function Page(){
  const [pin,setPin]=useState(""); const [unlocked,setUnlocked]=useState(false); const [authError,setAuthError]=useState("");
  const [aiStatus,setAiStatus]=useState<AiStatus|null>(null);
  const [diagnosing,setDiagnosing]=useState(false);

  async function unlock(e:FormEvent){
    e.preventDefault();setAuthError("");
    const r=await fetch("/api/admin/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin})});
    if(r.ok){
      setUnlocked(true);
      const statusResponse=await fetch("/api/admin/ai-status",{headers:{"x-common-admin-pin":pin}});
      const status:AiStatus=await statusResponse.json().catch(()=>({configured:false}));
      setAiStatus(statusResponse.ok?status:{configured:false});
    }else setAuthError("관리자 PIN을 확인해주세요.");
  }
  if(!unlocked)return <><PageHead eyebrow="ADMIN DEMO" title="관리자 페이지" desc="관리자 PIN을 입력해주세요."/><section className="section"><form className="container card admin-gate form" onSubmit={unlock}><LockKeyhole/><div className="field"><label htmlFor="admin-pin">Admin PIN</label><input id="admin-pin" type="password" required value={pin} onChange={e=>setPin(e.target.value)} autoComplete="current-password"/></div>{authError&&<p className="notice">{authError}</p>}<button className="button">관리자 페이지 열기</button><small>Prototype용 접근 제한입니다. Production에서는 실제 관리자 인증으로 교체해야 합니다.</small></form></section></>;
  async function diagnose(){
    setDiagnosing(true);
    try {
      const response=await fetch("/api/admin/ai-diagnostic",{method:"POST",headers:{"x-common-admin-pin":pin}});
      const result:AiStatus=await response.json();
      if(response.ok)setAiStatus(result);
      else setAiStatus(current=>({...current,openaiConnection:"error",structuredAI:"not_tested",heartLetter:"fallback",error:{code:"diagnostic_request_failed"},configured:current?.configured??false}));
    } catch {
      setAiStatus(current=>({...current,openaiConnection:"error",structuredAI:"not_tested",heartLetter:"fallback",error:{code:"network_error"},configured:current?.configured??false}));
    } finally { setDiagnosing(false); }
  }
  const mode=(aiStatus?.heartLetter??aiStatus?.mode??"demo").toUpperCase();
  const label=(value:AiStatus["openaiConnection"]|AiStatus["structuredAI"])=>value==="ok"?"정상":value==="error"?"오류":value==="not_configured"?"설정되지 않음":"진단 필요";
  const active=(value:string|undefined)=>value==="ok"||value==="live";
  return <><PageHead eyebrow="ADMIN DEMO" title="이번 달 COMMON" desc="민감한 개인 내용 없이, 지역사회와 만든 연결을 익명화된 숫자로 살펴봅니다."/><section className="section"><div className="container"><section className="card ai-admin-card"><p className="eyebrow">AI 마음편지</p><h2>AI 마음편지 상태</h2><div role="status" aria-live="polite">
    <p className={`connection-status ${aiStatus?.configured?"on":""}`}>서버 API Key　● {aiStatus?.configured?"설정됨":"설정되지 않음"}</p>
    <p className={`connection-status ${active(aiStatus?.openaiConnection)?"on":""}`}>OpenAI 연결　● {label(aiStatus?.openaiConnection)}</p>
    <p className={`connection-status ${active(aiStatus?.structuredAI)?"on":""}`}>Structured AI　● {label(aiStatus?.structuredAI)}</p>
    <p className={`connection-status ${mode==="LIVE"?"on":""}`}>현재 응답 모드　● {mode}</p>
    <p><strong>Attempts</strong>　{aiStatus?.attempts??"-"}</p>
    <p><strong>Recovered</strong>　{aiStatus?.recovered?"Yes":"No"}</p>
    <p><strong>Model</strong>　{aiStatus?.model??"-"}</p>
    {aiStatus?.error&&<div className="notice"><p><strong>마지막 오류</strong></p><p>오류 코드　{aiStatus.error.code}</p>{aiStatus.error.status!==undefined&&<p>상태　{aiStatus.error.status}</p>}{aiStatus.error.type&&<p>오류 유형　{aiStatus.error.type}</p>}{aiStatus.error.param&&<p>오류 위치　{aiStatus.error.param}</p>}</div>}
  </div><div className="inline-actions"><button className="button" type="button" onClick={diagnose} disabled={diagnosing}>{diagnosing?"진단 중…":aiStatus?.openaiConnection?"다시 진단":"AI 연결 진단"}</button><Link className="button secondary" href="/heart/letter">마음편지 확인</Link></div><p className="billing-note">진단은 서버에서 직접 기본 연결과 실제 마음편지 Structured Output을 각각 검사합니다. 비밀 키와 사용자 내용은 표시하지 않습니다.</p></section><section className="card ai-admin-card"><p className="eyebrow">PRAYER REQUEST</p><h2>기도 요청 설정</h2><p className={`connection-status ${aiStatus?.prayerEmail?.configured?"on":""}`}>상태　● {aiStatus?.prayerEmail?.configured?"정상":"설정 필요"}</p><p><strong>수신</strong>　{aiStatus?.prayerEmail?.recipient||"PRAYER_RECIPIENT_EMAIL 설정 필요"}</p><p><strong>Provider</strong>　Resend</p><p><strong>교회 홈페이지</strong>　<a className="church-link" href={SITE_CONFIG.churchUrl} target="_blank" rel="noreferrer">{SITE_CONFIG.churchName} ↗</a></p><p className="billing-note">수신 주소는 Netlify의 PRAYER_RECIPIENT_EMAIL 환경변수에서 변경합니다.</p></section><span className="demo-label">DEMO DASHBOARD · 실제 운영 데이터가 아닙니다</span><div className="grid admin-grid" style={{marginTop:24}}>{stats.map(([n,l,x])=><article className="card admin-card" key={l}><small>{l}</small><b>{n}</b><small>{x}</small></article>)}</div><div style={{textAlign:"center",marginTop:70}}><Link href="/impact" className="button">Community Impact 보기</Link> <Link href="/" className="button secondary">사용자 화면 보기</Link></div></div></section></>;
}
