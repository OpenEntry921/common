"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { PageHead } from "@/components/UI";

const stats=[["2,418","방문자","+12%"],["816","재방문자","33.7%"],["48","도움 요청","이번 달"],["31","도움 연결","연결률 65%"],["126","프로그램 신청","6개 프로그램"],["39","재능기부","+8명"],["27","기도 요청","내용 비공개"],["14","사람 연결 요청","내용 비공개"]];
const KEY_NAME="common-demo-openai-key";

export default function Page(){
  const [pin,setPin]=useState(""); const [unlocked,setUnlocked]=useState(false); const [authError,setAuthError]=useState("");
  const [key,setKey]=useState(""); const [connected,setConnected]=useState(false);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  useEffect(()=>setConnected(!!sessionStorage.getItem(KEY_NAME)),[]);
  async function unlock(e:FormEvent){e.preventDefault();setAuthError("");const r=await fetch("/api/admin/auth",{method:"POST",headers:{"x-common-admin-pin":pin}});if(r.ok){setUnlocked(true);sessionStorage.setItem("common-demo-admin","1")}else setAuthError("관리자 PIN을 확인해주세요.")}
  async function connect(e:FormEvent){e.preventDefault();if(!key.trim()||busy)return;setBusy(true);setMessage("");try{const r=await fetch("/api/admin/test-openai",{method:"POST",headers:{"x-common-admin-pin":pin,"x-common-openai-key":key.trim()}});if(!r.ok)throw new Error();sessionStorage.setItem(KEY_NAME,key.trim());setKey("");setConnected(true);setMessage("AI 연결이 완료되었습니다.")}catch{setMessage("연결할 수 없습니다. API Key를 다시 확인해주세요.")}finally{setBusy(false)}}
  function disconnect(){sessionStorage.removeItem(KEY_NAME);setConnected(false);setKey("");setMessage("AI 연결을 해제했습니다.")}
  if(!unlocked)return <><PageHead eyebrow="ADMIN DEMO" title="관리자 페이지" desc="관리자 PIN을 입력해주세요."/><section className="section"><form className="container card admin-gate form" onSubmit={unlock}><LockKeyhole/><div className="field"><label htmlFor="admin-pin">Admin PIN</label><input id="admin-pin" type="password" required value={pin} onChange={e=>setPin(e.target.value)} autoComplete="current-password"/></div>{authError&&<p className="notice">{authError}</p>}<button className="button">관리자 페이지 열기</button><small>Prototype용 접근 제한입니다. Production에서는 실제 관리자 인증으로 교체해야 합니다.</small></form></section></>;
  return <><PageHead eyebrow="ADMIN DEMO" title="이번 달 COMMON" desc="민감한 개인 내용 없이, 지역사회와 만든 연결을 익명화된 숫자로 살펴봅니다."/><section className="section"><div className="container"><section className="card ai-admin-card"><p className="eyebrow">AI 마음편지 설정</p><h2>AI 마음편지 설정</h2><p>OpenAI API Key를 연결하면 COMMON 마음편지에서 실제 AI 응답을 사용할 수 있습니다.</p><p className={`connection-status ${connected?"on":""}`}>● {connected?"AI 연결됨":"AI 연결 안 됨"}</p>{connected?<div><p><strong><CheckCircle2 size={18}/> OpenAI API가 연결되어 있습니다.</strong><br/><small>마음편지에서 실제 AI를 사용할 수 있습니다. Key 자체는 다시 표시하지 않습니다.</small></p><button className="button secondary" onClick={disconnect}>연결 해제</button></div>:<form className="form" onSubmit={connect}><div className="field"><label htmlFor="openai-key">OpenAI API Key</label><input id="openai-key" type="password" placeholder="sk-..." required value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" spellCheck={false}/></div><button className="button" disabled={busy}>{busy?"연결 확인 중…":"API Key 연결"}</button></form>}{message&&<div className="notice" role="status">{message}</div>}<p className="prototype-note">Demo 전용: Key는 현재 브라우저 탭의 sessionStorage에만 임시 보관되며 탭을 닫으면 사라집니다.</p></section><span className="demo-label">DEMO DASHBOARD · 실제 운영 데이터가 아닙니다</span><div className="grid admin-grid" style={{marginTop:24}}>{stats.map(([n,l,x])=><article className="card admin-card" key={l}><small>{l}</small><b>{n}</b><small>{x}</small></article>)}</div><div style={{textAlign:"center",marginTop:70}}><Link href="/impact" className="button">Community Impact 보기</Link> <Link href="/" className="button secondary">사용자 화면 보기</Link></div></div></section></>;
}
