import mongoose, { Schema, Model } from 'mongoose'

export interface ISessionSet {
  reps: number
  weight: number
  rpe?: number
}

export interface ISessionExercise {
  exerciseId: mongoose.Types.ObjectId
  altOfExerciseId?: mongoose.Types.ObjectId
  sets: ISessionSet[]
  notes?: string
}

export interface ISession {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  date: Date
  planId?: mongoose.Types.ObjectId
  planDayId?: mongoose.Types.ObjectId
  status: 'in_progress' | 'completed' | 'abandoned'
  checkIn: boolean
  makeupForDate?: Date
  startedAt: Date
  endedAt?: Date
  exercises: ISessionExercise[]
  totalVolume: number
  createdAt: Date
  updatedAt: Date
}

const SessionSetSchema = new Schema<ISessionSet>({
  reps: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  rpe: {
    type: Number,
    min: 1,
    max: 10
  }
}, { _id: false })

const SessionExerciseSchema = new Schema<ISessionExercise>({
  exerciseId: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  altOfExerciseId: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  },
  sets: [SessionSetSchema],
  notes: String
}, { _id: false })

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan'
  },
  planDayId: Schema.Types.ObjectId,
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  checkIn: {
    type: Boolean,
    default: false
  },
  makeupForDate: Date,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  exercises: [SessionExerciseSchema],
  totalVolume: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

SessionSchema.index({ userId: 1, date: -1 })
SessionSchema.index({ userId: 1, status: 1 })

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)


