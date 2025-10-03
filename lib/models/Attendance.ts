import mongoose, { Schema, Model } from 'mongoose'

export interface IAttendance {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  date: Date
  status: 'attended' | 'missed' | 'rest'
  madeUpBySessionId?: mongoose.Types.ObjectId
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['attended', 'missed', 'rest'],
    required: true
  },
  madeUpBySessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session'
  },
  notes: String
}, {
  timestamps: true
})

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true })

export const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema)


