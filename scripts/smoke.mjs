// 실행 중인 앱(npm run dev 또는 npm start)에 대해 화면과 API 흐름을 빠르게 확인합니다.
// 사용법: npm run smoke  (BASE_URL로 주소 변경 가능, 기본 http://localhost:3000)
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
let failed = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

async function api(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

for (const page of ['/', '/todos', '/weekly', '/goals']) {
  const res = await fetch(BASE + page);
  check(`GET ${page}`, res.status === 200, String(res.status));
}

// 다른 데이터와 겹치지 않도록 먼 미래의 주를 씁니다.
const year = 2100 + Math.floor(Math.random() * 800);
const weekStart = `${year}-03-03`;

const goal = await api('/api/goals', 'POST', { title: '스모크 목표', description: 'smoke' });
check('목표 생성', goal.status === 201, String(goal.status));
const week = await api('/api/weekly', 'POST', { weekStart, goals: ['주간 목표'], goalId: goal.body._id });
check('주간 계획 생성', week.status === 201, String(week.status));
const dup = await api('/api/weekly', 'POST', { weekStart });
check('같은 주 중복 → 409', dup.status === 409, String(dup.status));
const todo = await api('/api/todos', 'POST', { title: '스모크 할 일', weeklyPlanId: week.body._id, goalId: goal.body._id, dayOfWeek: 1 });
check('할 일 생성', todo.status === 201, String(todo.status));
const moved = await api(`/api/todos/${todo.body._id}`, 'PATCH', { status: 'done', order: 'a0' });
check('PATCH status=done', moved.status === 200 && moved.body.status === 'done');
const g = await api(`/api/goals/${goal.body._id}`);
check('목표 진행률 100%', g.body?.progress === 100, `progress=${g.body?.progress}`);
const w = await api(`/api/weekly/${week.body._id}`);
check('주간 진행률 100%', w.body?.todoProgress === 100, `todoProgress=${w.body?.todoProgress}`);
const detail = await fetch(`${BASE}/weekly/${week.body._id}`);
check('GET /weekly/[id]', detail.status === 200, String(detail.status));

// 정리
await api(`/api/todos/${todo.body._id}`, 'DELETE');
await api(`/api/weekly/${week.body._id}`, 'DELETE');
await api(`/api/goals/${goal.body._id}`, 'DELETE');

console.log(failed ? `\n${failed}개 실패` : '\n모두 통과');
process.exit(failed ? 1 : 0);
