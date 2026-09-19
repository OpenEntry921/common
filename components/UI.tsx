"use client";
import { X, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
export function PageHead({eyebrow,title,desc}:{eyebrow:string,title:string,desc:string}){return <section className="page-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{desc}</p></section>}
export function Modal({open,onClose,children}:{open:boolean,onClose:()=>void,children:React.ReactNode}){useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>e.key==="Escape"&&onClose();document.addEventListener("keydown",esc);return()=>document.removeEventListener("keydown",esc)},[open,onClose]);if(!open)return null;return <div className="modal-backdrop" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="닫기"><X/></button>{children}</div></div>}
export function Success({title,desc,onDone}:{title:string,desc:string,onDone?:()=>void}){return <div className="success"><CheckCircle2/><h2>{title}</h2><p>{desc}</p>{onDone&&<button className="button" onClick={onDone}>완료</button>}</div>}
export function Toast({message}:{message:string}){return <div className="toast"><CheckCircle2 size={18}/>{message}</div>}
