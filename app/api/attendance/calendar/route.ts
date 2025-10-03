import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Attendance } from '@/lib/models/Attendance'
import { Session } from '@/lib/models/Session'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, getDay } from 'date-fns'

// GET /api/attendance/calendar?month=YYYY-MM
async function getCalendar(req: AuthenticatedRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const monthParam = searchParams.get('month') // Format: YYYY-MM

    if (!monthParam) {
      return NextResponse.json(
        { error: 'Month parameter required (format: YYYY-MM)' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Parse month and get date range
    const [year, month] = monthParam.split('-').map(Number)
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = endOfMonth(monthStart)

    // Get user's active plan to determine scheduled days
    const activePlan = await Plan.findOne({
      userId: req.user!.userId,
      isActive: true,
    })

    // Get all sessions for the month
    const sessions = await Session.find({
      userId: req.user!.userId,
      date: {
        $gte: monthStart,
        $lte: monthEnd,
      },
      status: 'completed',
    }).lean()

    // Get attendance records
    const attendance = await Attendance.find({
      userId: req.user!.userId,
      date: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    }).lean()

    // Build calendar data
    const calendar = []
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    for (const day of days) {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayOfWeek = format(day, 'EEE').toLowerCase()

      // Check if day is scheduled
      let isScheduled = false
      if (activePlan && activePlan.schedule.mode === 'weekday') {
        const weekdayMap = activePlan.schedule.weekdayMap || {}
        isScheduled = !!weekdayMap[dayOfWeek]
      }

      // Get sessions for this day
      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.date)
        return format(sessionDate, 'yyyy-MM-dd') === dayKey
      })

      // Get attendance record
      const attendanceRecord = attendance.find((a) => {
        return format(new Date(a.date), 'yyyy-MM-dd') === dayKey
      })

      // Determine status
      let status = 'rest'
      if (attendanceRecord) {
        status = attendanceRecord.status
      } else if (daySessions.length > 0) {
        status = 'attended'
      } else if (isScheduled && day < new Date()) {
        status = 'missed'
      } else if (isScheduled) {
        status = 'scheduled'
      }

      calendar.push({
        date: dayKey,
        isScheduled,
        status,
        sessionCount: daySessions.length,
        hasDoubleSession: daySessions.length > 1,
        madeUpBySessionId: attendanceRecord?.madeUpBySessionId,
      })
    }

    return NextResponse.json({
      calendar,
      activePlan: activePlan
        ? {
            id: activePlan._id,
            name: activePlan.name,
            scheduleMode: activePlan.schedule.mode,
          }
        : null,
    })
  } catch (error) {
    console.error('Get calendar error:', error)
    return NextResponse.json(
      { error: 'Failed to get calendar' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getCalendar)

