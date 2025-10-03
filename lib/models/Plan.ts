import mongoose, { Schema, Model } from 'mongoose'

export interface IPlanExercise {
  exerciseId: mongoose.Types.ObjectId
  sets: number
  defaultReps?: number
  targetWeight?: number
  musclesOverride?: {
    primary: string[]
    secondary: string[]
  }
  alternates: mongoose.Types.ObjectId[]
}

export interface IPlanDay {
  _id: mongoose.Types.ObjectId
  name: string
  notes?: string
  exercises: IPlanExercise[]
}

export interface IPlan {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  sessionsPerWeek: number
  isActive: boolean
  schedule: {
    mode: 'weekday' | 'sequence'
    weekdayMap?: {
      mon?: mongoose.Types.ObjectId
      tue?: mongoose.Types.ObjectId
      wed?: mongoose.Types.ObjectId
      thu?: mongoose.Types.ObjectId
      fri?: mongoose.Types.ObjectId
      sat?: mongoose.Types.ObjectId
      sun?: mongoose.Types.ObjectId
    }
    sequenceOrder?: mongoose.Types.ObjectId[]
  }
  days: IPlanDay[]
  createdAt: Date
  updatedAt: Date
}

const PlanExerciseSchema = new Schema<IPlanExercise>({
  exerciseId: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  defaultReps: {
    type: Number,
    required: false,
    min: 1
  },
  targetWeight: Number,
  musclesOverride: {
    primary: [String],
    secondary: [String]
  },
  alternates: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
}, { _id: false })

const PlanDaySchema = new Schema<IPlanDay>({
  name: {
    type: String,
    required: true
  },
  notes: String,
  exercises: [PlanExerciseSchema]
})

const PlanSchema = new Schema<IPlan>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: false
  },
  schedule: {
    mode: {
      type: String,
      enum: ['weekday', 'sequence'],
      required: true
    },
    weekdayMap: {
      mon: Schema.Types.ObjectId,
      tue: Schema.Types.ObjectId,
      wed: Schema.Types.ObjectId,
      thu: Schema.Types.ObjectId,
      fri: Schema.Types.ObjectId,
      sat: Schema.Types.ObjectId,
      sun: Schema.Types.ObjectId
    },
    sequenceOrder: [Schema.Types.ObjectId]
  },
  days: [PlanDaySchema]
}, {
  timestamps: true
})

PlanSchema.index({ userId: 1, isActive: 1 })

export const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema)


