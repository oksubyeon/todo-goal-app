import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { MAX_WEEKLY_GOALS } from '@/types';
import { userScopePlugin } from '@/lib/userScope';

const WeeklyGoalSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 200 },
  done: { type: Boolean, default: false },
});

const WeeklyPlanSchema = new Schema(
  {
    // 월요일의 UTC 자정. 사용자마다 같은 주는 하나만 존재합니다 (아래 복합 unique 인덱스).
    weekStart: { type: Date, required: true },
    goals: {
      type: [WeeklyGoalSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= MAX_WEEKLY_GOALS,
        message: `주간 목표는 최대 ${MAX_WEEKLY_GOALS}개까지 만들 수 있습니다.`,
      },
    },
    memo: { type: String, default: '', maxlength: 10000 },
    retrospective: { type: String, default: '', maxlength: 10000 },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  },
  { timestamps: true },
);

WeeklyPlanSchema.plugin(userScopePlugin);
WeeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export type WeeklyPlanDoc = InferSchemaType<typeof WeeklyPlanSchema>;

export const WeeklyPlan: Model<WeeklyPlanDoc> =
  (mongoose.models.WeeklyPlan as Model<WeeklyPlanDoc>) ??
  mongoose.model<WeeklyPlanDoc>('WeeklyPlan', WeeklyPlanSchema);
