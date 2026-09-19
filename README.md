# COMMON

**Coffee · Community · Care**

## Concept

지역 카페를 기반으로 지역 주민과 교회가 자연스럽게 연결되는 Community Platform 프로토타입입니다. 교회를 먼저 드러내기보다 주민에게 도움이 되는 나눔, 프로그램, 대화 경험을 제공하고 사용자가 원할 때만 기도·상담·신앙 콘텐츠로 이어집니다.

## Core Philosophy

**People → Help → Relationship → Community → Church → Faith**

## Demo

| Route | 설명 |
| --- | --- |
| `/qr-demo` | 카페 테이블 QR 진입 화면 |
| `/` | 감정 선택, 서비스 탐색, 선택적 성경 문장 |
| `/give-ask` | 도움 요청과 재능 나눔 피드 |
| `/request-help`, `/share-talent` | 도움·재능 등록 폼 |
| `/community` | 지역 프로그램 목록과 신청 모달 |
| `/market` | 동네 나눔 장터 |
| `/heart` | OpenAI 연동과 안전한 데모 fallback을 사용하는 AI 마음편지 |
| `/prayer`, `/talk` | 익명 기도 및 사람 연결 요청 |
| `/my`, `/my/certificate` | Community Passport와 활동 인증서 |
| `/impact` | 데모 Community Impact 통계 |
| `/church` | 사용자가 선택해 접근하는 교회 소개 |
| `/privacy` | 개인정보와 신뢰 원칙 |
| `/admin-demo` | PIN으로 보호되는 익명 통계 및 AI 설정 운영자 데모 |

### 추천 시연 흐름

1. **일반 주민:** `/qr-demo` → Home → `위로` → 마음편지 → 기도 요청
2. **지역사회 연결:** Give & Ask → 연결 요청 → 프로그램 신청 → MY 활동 인증서
3. **운영 관점:** Admin Demo → Community Impact → 사용자 화면

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

### Demo API Key Mode

현재 관리자 페이지의 OpenAI API Key 연결 기능은 현장 시연 편의를 위한 **Prototype 기능**입니다. `/admin-demo`에서 Key를 붙여넣으면 실제 OpenAI 연결을 확인한 뒤 현재 브라우저 탭의 `sessionStorage`에만 임시 보관합니다. Key는 DB, 파일, Cookie, URL, LocalStorage 또는 Analytics에 저장하지 않으며 탭을 닫으면 사라집니다. 브라우저는 OpenAI를 직접 호출하지 않고 언제나 COMMON의 Server API Route를 거칩니다.

이 방식은 운영 환경용 보안 설계가 아닙니다. **Production 배포 시 브라우저 Key 입력을 제거하고 Server-side Secret Management 또는 Hosting Provider Secret으로 변경해야 합니다.** OpenAI client 생성은 `lib/openai-server.ts`에 모듈화되어 있어 Key source만 교체할 수 있습니다.

`.env.example`을 참고해 프로젝트 루트의 `.env.local`에 관리자 데모 PIN을 설정하세요. 서버 환경의 OpenAI Key는 브라우저 입력을 사용하지 않는 개발/향후 운영 방식의 선택적 fallback입니다.

```text
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
ADMIN_DEMO_PIN=choose_a_demo_pin
```

`OPENAI_API_KEY`와 `ADMIN_DEMO_PIN`은 서버 API Route에서만 읽습니다. **실제 비밀값을 소스 코드, `NEXT_PUBLIC_` 환경변수 또는 GitHub에 절대로 Commit하지 마세요.** `.env.local`은 `.gitignore`에 포함되어 있습니다. 현재 PIN gate는 Prototype 최소 보호이며 Production에서는 실제 관리자 인증·권한 시스템으로 교체해야 합니다.

## Future Roadmap

- Real Authentication
- Community Member Verification
- AI API
- Volunteer Matching
- Community Passport
- Verifiable Credentials
- DID
- Privacy-preserving Activity Records
- QR Table Integration
- Real Admin Analytics
