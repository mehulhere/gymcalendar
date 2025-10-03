import mongoose, { Schema, Model } from 'mongoose'

export interface IUser {
  _id: mongoose.Types.ObjectId
  email: string
  password_hash: string
  name: string
  settings: {
    unit: 'kg' | 'lb'
    timezone: string
    equipment: string[]
    theme: 'light' | 'dark' | 'system'
    bodyWeight?: number
    height?: number
    targetWeight?: number
    targetDays?: number
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  settings: {
    unit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    equipment: {
      type: [String],
      default: []
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark'
    },
    bodyWeight: Number,
    height: Number,
    targetWeight: Number,
    targetDays: Number
  }
}, {
  timestamps: true
})

UserSchema.index({ email: 1 })

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)


