import { PageHead } from "@/components/UI";import { RequestForm } from "@/components/RequestForm";
export default function Page(){return <><PageHead eyebrow="ASK FOR A HAND" title="도움이 필요해요" desc="혼자 해결하기 어려운 작은 일이 있다면 편하게 알려주세요. 이웃과 안전하게 연결해 드립니다."/><section className="section"><div className="container" style={{maxWidth:650}}><RequestForm kind="help"/></div></section></>}
