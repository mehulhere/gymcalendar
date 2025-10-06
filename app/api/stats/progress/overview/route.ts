import { NextResponse } from 'next/server'
import { startOfMonth, subMonths } from 'date-fns'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { calculateMonthlySummary, calculateWeeklySummary } from '@/lib/stats/progress'

async function getProgressOverview(req: AuthenticatedRequest) {
    try {
        await dbConnect()

        const referenceDate = new Date()
        const earliestDate = startOfMonth(subMonths(referenceDate, 1))

        const sessions = await Session.find({
            userId: req.user!.userId,
            status: 'completed',
            date: { $gte: earliestDate },
        })
            .populate('exercises.exerciseId', 'name')
            .sort({ date: 1 })
            .lean()

        const weekly = calculateWeeklySummary(sessions as any, referenceDate)
        const monthly = calculateMonthlySummary(sessions as any, referenceDate)

        return NextResponse.json({ weekly, monthly })
    } catch (error) {
        console.error('Progress overview error:', error)
        return NextResponse.json({ error: 'Failed to load progress overview' }, { status: 500 })
    }
}

export const GET = withAuth(getProgressOverview)

