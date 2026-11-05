import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { userScopePlugin } from '@/lib/userScope';

const GoalSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
  },
  { timestamps: true },
);

GoalSchema.plugin(userScopePlugin);

export type GoalDoc = InferSchemaType<typeof GoalSchema>;

export const Goal: Model<GoalDoc> =
  (mongoose.models.Goal as Model<GoalDoc>) ?? mongoose.model<GoalDoc>('Goal', GoalSchema);
