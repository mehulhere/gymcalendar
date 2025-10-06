import { NextResponse } from 'next/server'
import { startOfMonth, subMonths, subDays } from 'date-fns'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { WeighIn } from '@/lib/models/WeighIn'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import {
    calculateMonthlyComparison,
    calculateMonthlySummary,
    calculateWeeklyComparison,
    calculateWeeklySummary,
    detectRecordBreakers,
    extractSetsFromSessions,
    periodDateRange,
    ProgressDetailResponse,
    ProgressPeriod,
} from '@/lib/stats/progress'

async function getProgressDetail(
    req: AuthenticatedRequest,
    context: { params: Promise<{ period: string }> }
) {
    const params = await context.params
    const period = params.period as ProgressPeriod

    if (period !== 'weekly' && period !== 'monthly') {
        return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    try {
        await dbConnect()
        const referenceDate = new Date()
        const { start, end } = periodDateRange(period, referenceDate)

        const sessions = await Session.find({
            userId: req.user!.userId,
            status: 'completed',
        })
            .populate('exercises.exerciseId', 'name')
            .sort({ date: 1 })
            .lean()

        const weighinStart = period === 'weekly'
            ? subDays(end, 14)
            : startOfMonth(subMonths(referenceDate, 1))

        const weighIns = await WeighIn.find({
            userId: req.user!.userId,
            date: { $gte: weighinStart },
        })
            .sort({ date: 1 })
            .lean()

        const summary = period === 'weekly'
            ? calculateWeeklySummary(sessions as any, referenceDate)
            : calculateMonthlySummary(sessions as any, referenceDate)

        const comparison = period === 'weekly'
            ? calculateWeeklyComparison(sessions as any, weighIns as any, referenceDate)
            : calculateMonthlyComparison(sessions as any, weighIns as any, referenceDate)

        const sets = extractSetsFromSessions(sessions as any)
        const recordResults = detectRecordBreakers(sets, start, end)

        const bestRecords = recordResults.best
        const worstRecords = recordResults.worst

        const weightSeries = comparison.weightSeries
        const hasWeight = weightSeries?.some(value => value > 0) ?? false

        const response: ProgressDetailResponse = {
            period,
            currentVolume: summary.currentVolume,
            previousVolume: summary.previousVolume,
            percentChange: summary.percentChange,
            comparison: {
                labels: comparison.labels,
                currentSeries: comparison.currentSeries,
                previousSeries: comparison.previousSeries,
                weightSeries: hasWeight ? weightSeries : null,
            },
            bestRecords,
            worstRecords,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Progress detail error:', error)
        return NextResponse.json({ error: 'Failed to load progress detail' }, { status: 500 })
    }
}

export const GET = withAuth(getProgressDetail)
