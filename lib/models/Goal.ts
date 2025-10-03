import mongoose, { Schema, Model } from 'mongoose'

export interface IGoal {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  targetWeight: number
  targetDate: Date
  createdAt: Date
  updatedAt: Date
}

const GoalSchema = new Schema<IGoal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetWeight: {
    type: Number,
    required: true,
    min: 0
  },
  targetDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

GoalSchema.index({ userId: 1 })

export const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema)


