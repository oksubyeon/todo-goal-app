## 참고 문서
- PRD: docs/PRD.md
- 구현 계획: docs/PLAN.md

# 할일 + 계획 관리 앱 — 개발 가이드

할 일 → 주간 계획 → 1년 목표를 연결하는 개인용 계획 앱. 요구사항은 `docs/PRD.md`, 구현 계획은 `docs/PLAN.md`.

## 스택

Next.js 14 (App Router) · TypeScript · MongoDB + Mongoose 8 · Tailwind CSS 3 · Zustand 5 · dnd-kit · fractional-indexing · Vitest + mongodb-memory-server

## 실행

```bash
npm install
cp .env.example .env.local   # MONGODB_URI 설정
npm run db                   # (로컬 MongoDB가 없을 때) 개발용 DB를 27018 포트로 실행, 데이터는 .mongo-data/
npm run dev                  # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Vitest: 유틸·칸반 계산·스토어·API 통합 테스트 (메모리 DB 사용, 외부 DB 불필요) |
| `npm run db` | 개발용 MongoDB (mongodb-memory-server, 데이터 유지) |
| `npm run smoke` | 실행 중인 앱에 화면/API 흐름 점검 (`BASE_URL`로 주소 지정) |

## 폴더 구조

```
app/            페이지(/, /todos, /weekly, /weekly/[id], /goals)와 API Route(app/api/**)
components/     layout/ todos/ weekly/ goals/ shared/
lib/            mongodb(연결 캐시) api(에러·검증) progress(집계) kanban(드래그 계산) fractionalIndex utils(날짜) weekly todoInput apiClient
models/         Goal, WeeklyPlan(goals 서브도큐먼트 최대 5개), Todo
store/          Zustand: todoSlice, weeklySlice, goalSlice + useLoad/useProgress
types/          공통 타입과 상수
tests/          Vitest
scripts/        dev-db.mjs, smoke.mjs
```

## 디자인 시스템

흰 바탕, 잉크색 글자, 강조색 한 가지로 이루어진 마켓플레이스풍 디자인 언어를 따릅니다. 앱 이름과 로고는 이 앱의 것입니다.

- **강조색은 하나만, 아껴서 씁니다.** `brand-500` 코랄 #ff385c입니다. 눌림은 `brand-600` #e00b41, 비활성은 `brand-200` #ffd1da입니다. 다음 곳에만 씁니다.
  - 주요 버튼(`.btn-primary`)
  - 진행률 바
  - High 우선순위 배지
  - 로고
  - 인라인 링크(`text-brand-600`)

  나머지는 무채색입니다. 활성 탭, 오늘 날짜, 선택된 체크박스처럼 선택된 상태는 잉크(`fg`)로 표시합니다.
- **색 토큰:** 값은 `app/globals.css`의 CSS 변수에 있고, `.dark`에서는 값만 바뀝니다.

  | 토큰 | 라이트 값 | 용도 |
  |---|---|---|
  | `canvas` | #fff | 페이지 바닥 |
  | `surface` | #fff | 카드, 모달, 입력 |
  | `subtle` | #f7f7f7 | 옅은 채움, hover |
  | `strong` | #f2f2f2 | 원형 아이콘 버튼 |
  | `line` | #ddd | 1px 테두리 |
  | `line-soft` | #ebebeb | 옅은 구분선 |
  | `fg` | #222 | 잉크 |
  | `muted` | #6a6a6a | 보조 글자 |
  | `faint` | #929292 | 흐린 글자 |
  | `danger` | #c13515 | 오류 글자 |

  `slate-*`, `bg-white`, `text-red-*`처럼 색을 직접 쓰지 말고 토큰을 쓰세요.
- **모양:** 버튼과 입력은 `rounded-lg`(8px), 카드와 모달은 `rounded-card`(14px), 알약 모양과 아이콘 버튼은 `rounded-full`입니다. 주요 버튼과 입력은 높이 48px(`.btn`, `.input`)이고, 작은 버튼은 `.btn-sm`(36px)입니다.
- **그림자는 한 단계뿐입니다(`shadow-float`).** 카드는 평소에 그림자 없이 1px 테두리만 두고, hover(`.card-float`), 드롭다운, 모달, 로그인 카드에만 그림자를 씁니다.
- **입력:** 포커스하면 2px 잉크 테두리가 됩니다. 글로우나 링은 없습니다.
- **공통 클래스(`app/globals.css`):** `.card`, `.card-float`, `.card-title`, `.btn-primary`, `.btn-secondary`(잉크 테두리), `.btn-ghost`(hover 시 밑줄), `.btn-danger`, `.btn-sm`, `.btn-pill`, `.icon-btn`, `.input`, `.label`, `.badge-neutral`, `.badge-quiet`, `.badge-brand`, `.badge-outline`.
- **타이포그래피:** 화면 제목은 28px/700(`PageHeader`), 카드 제목은 16px/600, 본문은 16px, 메타 정보는 14px입니다. 배지는 한글 가독성을 위해 12px로 둡니다(원본 문서는 11px).
- **내비게이션:** `TopNav`는 높이 80px입니다. 로고는 왼쪽, 탭은 가운데에 두고 활성 탭에 2px 잉크 밑줄을 그립니다. 오른쪽에는 테마 토글과 알약 모양 계정 메뉴(드롭다운에 사용자 이름과 로그아웃)가 있습니다. 768px 미만에서는 햄버거 메뉴로 바뀝니다.
- **다크 모드:** 같은 원칙을 어두운 무채색과 코랄로 옮긴 버전입니다. 헤더의 `ThemeToggle`이 시스템 → 라이트 → 다크 순으로 바꾸고, 선택은 `localStorage.theme`에 저장합니다. `app/layout.tsx`의 인라인 스크립트가 페인트 전에 적용합니다.
- **폰트:** Pretendard Variable(npm `pretendard`, 자체 호스팅)입니다. Inter 기반이라 원본 문서가 권하는 Inter 대체와 비율이 같고, 한글도 지원합니다.
- **아이콘과 레이아웃:** 아이콘은 `components/shared/Icon.tsx`(선 아이콘)를 쓰고 이모지는 쓰지 않습니다. 본문은 최대 1280px(`max-w-content`)이고, 좌우 여백은 24px, 768px 이상에서는 40px입니다.

## 핵심 규칙

- **주(week)**: 월요일 시작. `weekStart`는 월요일의 **UTC 자정 Date**로 저장하고, 클라이언트는 `'YYYY-MM-DD'`로 주고받습니다 (`lib/utils.ts`의 `weekKey`, `parseDateKey`, `dateKeyFromStored`). 서버는 아무 날짜나 받아도 그 주 월요일로 맞춥니다.
- **요일**: `dayOfWeek`는 JS `getDay()` 규칙(0=일 … 6=토). 화면은 월~일 순서(`WEEK_DAYS`).
- **칸반 순서**: `order`는 fractional index 문자열이며 컬럼(status) 안에서 사전순 정렬합니다. 카드를 옮기면 `lib/kanban.ts`의 `computeDrop`이 이웃 사이 키를 만들고 `PATCH /api/todos/[id] {status, order}` **한 번**만 보냅니다. 스토어가 먼저 화면을 바꾸고 실패하면 되돌립니다.
- **우선순위 고정**: High는 컬럼 맨 위에 표시됩니다. `computeDrop`은 같은 그룹(High / 그 외)의 이웃만 보고 키를 만듭니다.
- **진행률**: DB에 저장하지 않고 계산합니다. 주간 진행률 = 그 주 할 일 중 done 비율, 목표 진행률 = 그 목표에 연결된 할 일 중 done 비율. 화면은 스토어의 할 일로 계산(`useProgress`)하므로 상태를 바꾸면 바로 반영됩니다. API 응답에도 같은 값(`todoProgress`, `progress`)이 들어 있습니다.
  - PLAN.md Phase 4는 주간 진행률을 `goals[].done` 기준으로 적었지만, PRD §3 "완료 작업이 주간 진행률에 자동 반영"에 맞춰 할 일 기준으로 구현했습니다. 주간 목표 체크 수는 카드에 따로 표시합니다.
- **삭제**: 목표를 삭제하면 할 일·주간 계획의 `goalId`만 해제, 주간 계획을 삭제하면 할 일의 `weeklyPlanId`/`dayOfWeek`만 해제합니다.
- **에러 응답**: `{ error: string }`. 검증 실패·잘못된 ObjectId 400, 없음 404, 같은 주 중복 409, DB 연결 실패 500 (`lib/api.ts`의 `route()`).
- **SSR**: `KanbanBoard`는 `dynamic(..., { ssr: false })`로 불러옵니다. 페이지는 클라이언트 컴포넌트이며 데이터는 `useLoad()`로 한 번 불러와 스토어에 둡니다.
