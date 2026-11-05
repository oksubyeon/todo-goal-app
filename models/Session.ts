import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const SessionSchema = new Schema(
  {
    // 쿠키에는 무작위 토큰을, DB에는 그 sha256만 저장합니다. DB가 유출돼도 세션을 가로챌 수 없습니다.
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // 만료 시각이 지나면 MongoDB TTL 인덱스가 문서를 지웁니다.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export type SessionDoc = InferSchemaType<typeof SessionSchema>;

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ?? mongoose.model<SessionDoc>('Session', SessionSchema);
