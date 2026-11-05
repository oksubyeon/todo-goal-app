import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { userScopePlugin } from '@/lib/userScope';

const TodoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    dueDate: { type: Date, default: null },
    dayOfWeek: { type: Number, min: 0, max: 6, default: null }, // 0=일 … 6=토
    order: { type: String, required: true }, // fractional index, 사전순 정렬
    weeklyPlanId: { type: Schema.Types.ObjectId, ref: 'WeeklyPlan', default: null },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  },
  { timestamps: true },
);

TodoSchema.plugin(userScopePlugin);
TodoSchema.index({ status: 1, order: 1 });
TodoSchema.index({ weeklyPlanId: 1 });
TodoSchema.index({ goalId: 1 });

export type TodoDoc = InferSchemaType<typeof TodoSchema>;

export const Todo: Model<TodoDoc> =
  (mongoose.models.Todo as Model<TodoDoc>) ?? mongoose.model<TodoDoc>('Todo', TodoSchema);
