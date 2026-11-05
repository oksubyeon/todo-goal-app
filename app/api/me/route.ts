import { User } from '@/models/User';
import { HttpError, json, route } from '@/lib/api';
import { currentUserId } from '@/lib/userScope';

export const dynamic = 'force-dynamic';

/** 로그인한 사용자 정보 */
export const GET = route(async () => {
  const user = await User.findById(currentUserId()).select('username avatarUrl').lean();
  if (!user) throw new HttpError(401, '로그인이 필요합니다.');
  return json({ username: user.username, avatarUrl: user.avatarUrl });
});
