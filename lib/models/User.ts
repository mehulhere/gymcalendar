import mongoose, { Schema, Model } from 'mongoose'

export interface IUser {
  _id: mongoose.Types.ObjectId
  email: string
  password_hash?: string // Optional for OAuth users
  name: string
  image?: string // Profile image URL for OAuth users
  provider: 'credentials' | 'google' | 'github' // Auth provider
  providerId?: string // OAuth provider user ID
  passwordResetToken?: string
  passwordResetExpires?: Date
  settings: {
    unit: 'kg' | 'lb'
    timezone: string
    equipment: string[]
    theme: 'light' | 'dark' | 'system'
    bodyWeight?: number
    height?: number
    targetWeight?: number
    targetDays?: number
    weeklyTargetDays?: number
    autoCheckIn?: boolean
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
    required: function() {
      return this.provider === 'credentials'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: String,
  provider: {
    type: String,
    enum: ['credentials', 'google', 'github'],
    default: 'credentials'
  },
  providerId: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
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
    autoCheckIn: {
      type: Boolean,
      default: true
    },
    bodyWeight: Number,
    height: Number,
    targetWeight: Number,
    targetDays: Number,
    weeklyTargetDays: Number
  }
}, {
  timestamps: true
})

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)


