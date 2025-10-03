import mongoose, { Schema, Model } from 'mongoose'

export interface IExercise {
  _id: mongoose.Types.ObjectId
  name: string
  aliases: string[]
  equipment: 'machine' | 'cable' | 'dumbbell' | 'barbell' | 'bodyweight' | 'band'
  primary_muscles: string[]
  secondary_muscles: string[]
  category: 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'core'
  youtube_query_override?: string
  createdBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const ExerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  aliases: {
    type: [String],
    default: []
  },
  equipment: {
    type: String,
    enum: ['machine', 'cable', 'dumbbell', 'barbell', 'bodyweight', 'band'],
    required: true
  },
  primary_muscles: {
    type: [String],
    required: true
  },
  secondary_muscles: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['push', 'pull', 'hinge', 'squat', 'carry', 'core'],
    required: true
  },
  youtube_query_override: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
})

ExerciseSchema.index({ name: 'text', aliases: 'text' })
ExerciseSchema.index({ primary_muscles: 1 })
ExerciseSchema.index({ equipment: 1 })

export const Exercise: Model<IExercise> = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema)


