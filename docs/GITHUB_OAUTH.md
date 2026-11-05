# GitHub OAuth 로그인 설정

이 앱은 GitHub 계정으로만 로그인합니다. 로그인하지 않으면 화면은 `/login`으로 이동하고, API는 `401`을 돌려줍니다. 사용자는 자기가 만든 목표, 주간 계획, 할 일만 보고 고칠 수 있습니다.

## 1. GitHub OAuth App 만들기

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   (바로가기: https://github.com/settings/applications/new)
2. 아래처럼 입력합니다.

   | 항목 | 로컬 개발 | 배포 |
   |---|---|---|
   | Application name | 아무 이름 (예: 할일 + 계획) | |
   | Homepage URL | `http://localhost:3000` | `https://내도메인` |
   | Authorization callback URL | `http://localhost:3000/auth/github/callback` | `https://내도메인/auth/github/callback` |

3. **Register application**을 누른 뒤 **Client ID**를 복사하고, **Generate a new client secret**으로 Client secret을 만들어 복사합니다. Client secret은 이때 한 번만 보입니다.

> 로컬과 배포 주소가 다르면 OAuth App을 따로 만드는 것이 가장 간단합니다. 콜백 URL은 하나만 등록할 수 있습니다.

## 2. 환경 변수

`.env`(git에 올라가지 않음)에 넣습니다. 형식은 `.env.example`과 같습니다.

```bash
MONGODB_URI=...
GITHUB_CLIENT_ID=복사한 Client ID
GITHUB_CLIENT_SECRET=복사한 Client secret
# 배포할 때만: APP_URL=https://내도메인
```

- Client secret은 코드에 적지 말고 `.env` 또는 배포 환경의 환경 변수에만 둡니다. 코드는 `process.env.GITHUB_CLIENT_SECRET`만 읽습니다.
- 값을 바꾸면 개발 서버를 다시 시작하세요 (`npm run dev`).
- `APP_URL`을 비워 두면 요청이 들어온 주소로 콜백 URL을 만듭니다. 이 값은 GitHub에 등록한 콜백 URL과 정확히 같아야 합니다. 다르면 GitHub가 `redirect_uri is not associated with this application` 오류를 냅니다.

## 3. 로그인 흐름

| 경로 | 동작 |
|---|---|
| `GET /auth/github` | 무작위 `state`를 httpOnly 쿠키에 저장하고 GitHub 인증 페이지로 이동 (scope: `read:user`) |
| `GET /auth/github/callback` | `state`를 확인한 뒤 `code`로 access token을 받고, `GET https://api.github.com/user`로 사용자 정보를 가져옵니다. `users` 컬렉션에 `githubId`, `username`(login), `avatarUrl`(avatar_url)을 저장하거나 갱신하고, 세션을 만든 뒤 `/`(또는 원래 가려던 화면)로 이동 |
| `POST /auth/logout` | DB의 세션 문서를 삭제하고 `sid` 쿠키를 만료 |
| `GET /api/me` | 로그인한 사용자의 `username`, `avatarUrl` |

- 세션: 쿠키 `sid`에는 무작위 토큰을 넣고, DB(`sessions`)에는 그 SHA-256 해시만 저장합니다. 유효 기간은 30일이며, 만료된 세션은 TTL 인덱스가 자동으로 지웁니다. 쿠키 속성은 httpOnly, SameSite=Lax, 운영 환경에서 Secure입니다.
- GitHub access token은 사용자 정보를 받는 데만 쓰고 저장하지 않습니다.
- 실패하면 `/login?error=...`로 이동합니다.

| error | 원인 |
|---|---|
| `config` | 환경 변수 없음 |
| `state` | state 불일치·만료 또는 code 없음 |
| `denied` | GitHub에서 취소 |
| `github` | 토큰 교환이나 사용자 조회 실패 |
| `server` | DB 오류 |

## 4. 기존 데이터 마이그레이션

로그인 기능 이전에 만든 목표, 주간 계획, 할 일에는 `userId`가 없습니다. 이런 문서는 아무 사용자에게도 보이지 않으니, 한 번 로그인한 뒤 본인 계정에 연결하세요.

```bash
npm run migrate:user-id                 # 확인만: userId 없는 문서 수 출력 (쓰기 없음)
npm run migrate:user-id -- <GitHub아이디>  # 그 사용자에게 연결
```

> 여러 사람이 같은 DB를 쓰기 전에 꼭 실행하세요. 실행 전에는 예전 `weekStart` unique 인덱스가 남아 있어서, 다른 사용자가 같은 주의 계획을 만들면 409가 납니다.

이 명령은 다음을 합니다.

- `goals`, `weeklyplans`, `todos`에서 `userId`가 없는 문서에 그 사용자의 `_id`를 넣습니다. 이미 소유자가 있는 문서는 건드리지 않습니다.
- `weeklyplans`의 예전 `weekStart` unique 인덱스를 지우고 `{ userId, weekStart }` unique 인덱스를 만듭니다. 사용자마다 한 주에 계획 하나라는 규칙은 그대로입니다.
- 여러 번 실행해도 안전합니다.
- 다음 경우에는 아무것도 쓰지 않고 중단합니다.
  - 사용자를 찾을 수 없을 때
  - 그 사용자에게 같은 주의 주간 계획이 이미 있을 때

## 5. 구현 위치

| 파일 | 역할 |
|---|---|
| `lib/github.ts` | OAuth 설정, 토큰 교환, 사용자 조회 |
| `lib/session.ts` | 세션 생성, 확인, 삭제와 쿠키 옵션 |
| `lib/userScope.ts` | 요청별 사용자 컨텍스트와 Mongoose 플러그인. Goal, WeeklyPlan, Todo의 모든 쿼리에 `{ userId }`를 자동으로 붙이고, 생성할 때 소유자를 넣습니다. 컨텍스트가 없으면 쿼리가 실패합니다. 그래서 기존 CRUD 코드(`app/api/**/route.ts`)를 바꾸지 않고도 본인 데이터만 다룹니다. |
| `lib/api.ts`의 `route()` | 세션 확인. 없으면 401, 있으면 그 사용자 컨텍스트에서 핸들러 실행 |
| `middleware.ts` | 세션 쿠키가 없는 화면 요청을 `/login`으로 이동 |
| `app/auth/**`, `app/login`, `app/api/me` | 라우트와 화면 |
| `scripts/migrate-user-id.mjs` | 마이그레이션 |

> 필드 이름: 요구사항의 `user_id`는 이 코드베이스의 camelCase 규칙(`goalId`, `weeklyPlanId`)에 맞춰 `userId`로 저장합니다.
