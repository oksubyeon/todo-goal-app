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
