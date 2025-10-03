import mongoose, { Schema, Model } from 'mongoose'

export interface IWeighIn {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  date: Date
  weight: number
  note?: string
  createdAt: Date
  updatedAt: Date
}

const WeighInSchema = new Schema<IWeighIn>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  note: String
}, {
  timestamps: true
})

WeighInSchema.index({ userId: 1, date: -1 })

export const WeighIn: Model<IWeighIn> = mongoose.models.WeighIn || mongoose.model<IWeighIn>('WeighIn', WeighInSchema)


