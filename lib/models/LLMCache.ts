import mongoose, { Schema, Model } from 'mongoose'

export interface ILLMCache {
  _id: mongoose.Types.ObjectId
  type: 'TIP' | 'ALTERNATE' | 'INSIGHT'
  keyHash: string
  prompt: string
  response: string
  metadata: {
    exerciseId?: mongoose.Types.ObjectId
    userId?: mongoose.Types.ObjectId
    [key: string]: any
  }
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const LLMCacheSchema = new Schema<ILLMCache>({
  type: {
    type: String,
    enum: ['TIP', 'ALTERNATE', 'INSIGHT'],
    required: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index
  }
}, {
  timestamps: true
})

LLMCacheSchema.index({ type: 1, keyHash: 1 })

export const LLMCache: Model<ILLMCache> = mongoose.models.LLMCache || mongoose.model<ILLMCache>('LLMCache', LLMCacheSchema)


