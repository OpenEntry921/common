# COMMON

**Coffee · Community · Care**

## Concept

신성커뮤니티교회가 공간을 지역사회에 열고, 사람과 활동을 연결하며, 공간에서 생긴 가치가 다시 동네로 돌아가는 지역사회 순환 플랫폼 프로토타입입니다. 마음의 COMMON과 지역사회 기능은 서로의 이용을 전제로 하지 않습니다.

## Core Philosophy

**SPACE → PEOPLE → COMMUNITY → CIRCLE**

## Demo

| Route | 설명 |
| --- | --- |
| `/qr-demo` | 카페 테이블 QR 진입 화면 |
| `/` | 감정 선택, 서비스 탐색, 선택적 성경 문장 |
| `/community` | THIS WEEK · 승인된 활동을 보여줄 데이터 기반 목록 |
| `/space`, `/space/[slug]` | 공간 목록·상세와 COMMON OPEN을 포함한 신청 흐름 |
| `/table` | QUIET TABLE과 COMMON TABLE 안내 |
| `/connect` | 비공개 연결 요청과 연결 우선순위 안내 |
| `/circle` | 공간 사용에서 지역사회 환원으로 이어지는 원칙 |
| `/give-ask`, `/market`, `/request-help`, `/share-talent` | 기존 주소 호환을 위한 새 지역사회 영역 redirect |
| `/heart` | OpenAI 연동과 안전한 데모 fallback을 사용하는 AI 마음편지 |
| `/prayer`, `/talk` | 익명 기도 및 사람 연결 요청 |
| `/my`, `/my/certificate` | Community Passport와 활동 인증서 |
| `/impact` | 명시적으로 표시된 DEMO 환원 요약과 내역 |
| `/church` | 사용자가 선택해 접근하는 교회 소개 |
| `/privacy` | 개인정보와 신뢰 원칙 |
| `/admin-demo` | PIN으로 보호되는 익명 통계 및 AI 설정 운영자 데모 |

### 추천 시연 흐름

1. **일반 주민:** `/qr-demo` → Home → `위로` → 마음편지 → 기도 요청
2. **지역사회 순환:** 이번 주 COMMON → SPACE → TABLE → CONNECT → CIRCLE
3. **운영 관점:** Admin Demo → 함께 만든 변화 → 사용자 화면

마음편지를 제외한 입력과 수치는 시연용이며 서버에 저장되지 않습니다. 마음편지 내용은 응답 생성을 위해 OpenAI API로 전송되지만 DB, LocalStorage 또는 Analytics에 저장하지 않습니다.

## Development

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm run build
npm start
```

교회명, 카페명과 연락처는 `lib/config.ts`에서 한 번에 변경할 수 있습니다.

### AI Heart Letter

COMMON 마음편지는 OpenAI Responses API를 이용하여 사용자의 이야기에 대한 응답, 관련 성경 말씀의 위치와 문맥, 현재 삶과 연결한 묵상을 제공합니다. 대화는 현재 브라우저 세션의 메모리에만 유지되며 새로고침 후 복원하거나 데이터베이스에 저장하지 않습니다. API 장애나 timeout 시에는 준비된 데모 응답으로 자동 전환됩니다.

### Server-side OpenAI 설정

마음편지의 OpenAI API Key는 브라우저가 아니라 Next.js 서버에서만 `OPENAI_API_KEY` 환경변수로 읽습니다. 브라우저는 마음편지 내용만 `/api/heart-letter`에 보내며 Key, Authorization header 또는 Key 일부를 받거나 저장하지 않습니다. 따라서 Netlify에 Secret을 한 번 설정하면 어느 기기에서 접속해도 같은 서버 설정을 사용합니다.

`.env.example`을 참고해 프로젝트 루트의 `.env.local`에 관리자 데모 PIN, OpenAI Key와 모델을 설정하세요.

```text
ADMIN_DEMO_PIN=your-admin-pin
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=your-model-id
```

`OPENAI_API_KEY`와 `ADMIN_DEMO_PIN`은 Netlify에서 **Contains secret values**로 설정하고 서버 API Route에서만 읽습니다. Secrets Scanning은 활성화한 상태로 유지합니다. **실제 비밀값을 소스 코드, `NEXT_PUBLIC_` 환경변수 또는 GitHub에 절대로 Commit하지 마세요.** 로컬에서는 `.env.local`을 사용할 수 있으며 이 파일은 `.gitignore`에 포함되어 있습니다. 현재 PIN gate는 Prototype 최소 보호이며 Production에서는 실제 관리자 인증·권한 시스템으로 교체해야 합니다.

## 실제 운영 전 TODO

- 실제 2층 공간 목록, 사진, 수용인원, 사용료, 운영비 기준과 대관 가능 시간 확정
- COMMON OPEN 운영 정책과 COMMON TABLE의 실제 운영·현장 표시 방식 확정
- COMMON CONNECT 분야, 전문가 참여·검증 기준과 비공개 요청 처리 체계 확정
- 참여 가능한 교회·지역 전문가 조사 및 지역 무료 공공서비스 조사
- 실제 환원 대상기관 선정 기준, 회계처리, 증빙 공개 방식과 공간 운영 관련 세무·회계 검토
- 프로그램·공간·신청·CONNECT·CIRCLE 데이터를 관리할 관리자 저장소와 권한 시스템 연결

## 기도 요청 이메일 설정

기도 요청은 브라우저가 아닌 `POST /api/prayer` 서버 Route에서 Resend API를 통해 HTML 및 일반 텍스트 이메일로 전달됩니다. 요청 내용은 데이터베이스나 브라우저 저장소에 보관하지 않습니다. Netlify에 다음 server-side 환경변수를 설정하세요.

- `PRAYER_RECIPIENT_EMAIL`: 기도 요청을 받을 운영 이메일
- `RESEND_API_KEY`: Resend API key (secret 값으로 설정)
- `PRAYER_FROM_EMAIL`: Resend에서 인증된 발신 주소 (예: `prayer@example.com`)

`RESEND_API_KEY`에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. Provider가 설정되지 않았거나 Resend가 발송 요청을 정상 접수하지 않으면 API는 성공을 반환하지 않습니다. 수신 주소 변경에는 코드 배포가 필요하지 않습니다.
