import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Attendance } from '@/lib/models/Attendance'
import { Session } from '@/lib/models/Session'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { eachDayOfInterval, format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { formatZonedDayKey, getMonthRangeUtcExclusive, getStartOfDayUtcForZone } from '@/lib/utils/time'

// GET /api/attendance/calendar?month=YYYY-MM
async function getCalendar(req: AuthenticatedRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const monthParam = searchParams.get('month') // Format: YYYY-MM
    const timeZone = searchParams.get('timeZone') || 'UTC'

    if (!monthParam) {
      return NextResponse.json(
        { error: 'Month parameter required (format: YYYY-MM)' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Parse month and get date range based on user's time zone
    const [year, month] = monthParam.split('-').map(Number)
    const { startUtc, endUtcExclusive } = getMonthRangeUtcExclusive(year, month, timeZone)

    // Extend the range to cover full ISO weeks (Mon-Sun) that overlap the month
    const localMonthStart = new Date(startUtc)
    const localMonthEnd = new Date(endUtcExclusive.getTime() - 1)
    const extendedStartLocal = startOfWeek(localMonthStart, { weekStartsOn: 1 })
    const extendedEndLocal = endOfWeek(localMonthEnd, { weekStartsOn: 1 })
    const extendedStartUtc = getStartOfDayUtcForZone(extendedStartLocal, timeZone)
    const extendedEndUtcExclusive = getStartOfDayUtcForZone(addDays(extendedEndLocal, 1), timeZone)

    // Get user's active plan to determine scheduled days
    const activePlan = await Plan.findOne({
      userId: req.user!.userId,
      isActive: true,
    })

    // Get all sessions for the month
    const sessions = await Session.find({
      userId: req.user!.userId,
      date: {
        $gte: extendedStartUtc,
        $lt: extendedEndUtcExclusive,
      },
      status: 'completed',
    }).lean()

    // Get attendance records
    const attendance = await Attendance.find({
      userId: req.user!.userId,
      date: {
        $gte: extendedStartUtc,
        $lt: extendedEndUtcExclusive,
      },
    }).lean()

    // Build calendar data
    const calendar = []
    const days = eachDayOfInterval({ start: new Date(startUtc), end: new Date(endUtcExclusive.getTime() - 1) })
    const extendedDays = eachDayOfInterval({ start: extendedStartLocal, end: extendedEndLocal })

    for (const day of days) {
      const dayKey = formatZonedDayKey(day, timeZone)
      const dayOfWeek = format(day, 'EEE').toLowerCase()

      // Check if day is scheduled
      let isScheduled = false
      if (activePlan && activePlan.schedule.mode === 'weekday') {
        const weekdayMap = activePlan.schedule.weekdayMap || {}
        isScheduled = !!weekdayMap[dayOfWeek]
      }

      // Get sessions for this day
      const daySessions = sessions.filter((s) => formatZonedDayKey(new Date(s.date), timeZone) === dayKey)

      // Get attendance record
      const attendanceRecord = attendance.find((a) => formatZonedDayKey(new Date(a.date), timeZone) === dayKey)

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

    // Compute weekly achievements if user has a target
    const user = await Plan.db.model('User').findById(req.user!.userId).select('settings.weeklyTargetDays')
    const weeklyTarget = user?.settings?.weeklyTargetDays || 0
    const weeklyHighlights: { weekStart: string; achieved: boolean }[] = []
    const suggestedWeekHighlights: string[] = []
    const goldenDots: string[] = []

    if (weeklyTarget > 0) {
      // Build attended set across extended range
      const attendedKeySetFull = new Set<string>()
      for (const s of sessions) attendedKeySetFull.add(formatZonedDayKey(new Date(s.date), timeZone))
      for (const a of attendance) if (a.status === 'attended') attendedKeySetFull.add(formatZonedDayKey(new Date(a.date), timeZone))

      // Weekly highlights across extended range
      for (let i = 0; i < extendedDays.length; i += 7) {
        const weekSlice = extendedDays.slice(i, i + 7)
        const weekDates = weekSlice.map(d => formatZonedDayKey(d, timeZone))
        const attendedThisWeek = weekDates.filter(k => attendedKeySetFull.has(k)).length
        weeklyHighlights.push({ weekStart: weekDates[0], achieved: attendedThisWeek >= weeklyTarget })
      }

      // Build weekly buckets across extended range
      const extendedWeekObjs: { weekStart: string; weekDates: string[]; attendedDates: string[]; nonAttendedDates: string[]; attendedCount: number }[] = []
      for (let i = 0; i < extendedDays.length; i += 7) {
        const weekSlice = extendedDays.slice(i, i + 7)
        const weekDates = weekSlice.map(d => formatZonedDayKey(d, timeZone))
        const attendedDates = weekDates.filter(dk => attendedKeySetFull.has(dk))
        const nonAttendedDates = weekDates.filter(dk => !attendedKeySetFull.has(dk))
        extendedWeekObjs.push({
          weekStart: weekDates[0],
          weekDates,
          attendedDates,
          nonAttendedDates,
          attendedCount: attendedDates.length,
        })
      }

      // Month date set for clipping golden dots/highlights to current month grid
      const monthDateSet = new Set<string>(days.map(d => formatZonedDayKey(d, timeZone)))

      // Earliest attended across extended range
      let earliestAttendedKey: string | null = null
      for (const d of extendedDays) {
        const key = formatZonedDayKey(d, timeZone)
        if (attendedKeySetFull.has(key)) { earliestAttendedKey = key; break }
      }
      let earliestWeekStart: string | null = null
      if (earliestAttendedKey) {
        for (const w of extendedWeekObjs) {
          if (w.weekDates.includes(earliestAttendedKey)) { earliestWeekStart = w.weekStart; break }
        }
      }

      // Walk backwards and assign extras
      let extrasCarry = 0
      for (let i = extendedWeekObjs.length - 1; i >= 0; i--) {
        const w = extendedWeekObjs[i]

        if (extrasCarry > 0 && w.attendedCount < weeklyTarget) {
          const deficit = weeklyTarget - w.attendedCount
          // choose non-attended dates that are inside current month
          const candidates = w.nonAttendedDates.filter(dk => monthDateSet.has(dk))
          const assign = Math.min(deficit, extrasCarry, candidates.length)
          for (let k = 0; k < assign; k++) {
            goldenDots.push(candidates[k])
          }
          if (assign > 0 && w.attendedCount + assign >= weeklyTarget && monthDateSet.has(w.weekStart)) {
            suggestedWeekHighlights.push(w.weekStart)
          }
          extrasCarry -= assign
        }

        // add extras from this week (over target) using extended counts
        const extraThisWeek = Math.max(0, w.attendedCount - weeklyTarget)
        // Only track extras; do not mark the source week with a golden dot
        extrasCarry += extraThisWeek

        if (earliestWeekStart && w.weekStart === earliestWeekStart) break
      }
    }

    return NextResponse.json({
      calendar,
      weeklyHighlights,
      suggestedWeekHighlights,
      goldenDots: Array.from(new Set(goldenDots)),
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

