import { PageHead } from "@/components/UI";import { RequestForm } from "@/components/RequestForm";
export default function Page(){return <><PageHead eyebrow="SHARE YOUR TALENT" title="도움을 드릴 수 있어요" desc="수학, 컴퓨터, 동행, 영어회화, 간단한 집수리까지. 당신의 작은 재능이 이웃에게 큰 도움이 됩니다."/><section className="section"><div className="container" style={{maxWidth:650}}><RequestForm kind="talent"/></div></section></>}
