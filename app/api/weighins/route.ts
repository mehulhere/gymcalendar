import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { WeighIn } from '@/lib/models/WeighIn'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

const createWeighInSchema = z.object({
  date: z.string(),
  weight: z.number().positive(),
  note: z.string().optional(),
})

// GET /api/weighins
async function getWeighIns(req: AuthenticatedRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    await dbConnect()

    const query: any = { userId: req.user!.userId }

    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }

    const weighIns = await WeighIn.find(query).sort({ date: -1 }).limit(100).lean()

    return NextResponse.json({ weighIns })
  } catch (error) {
    console.error('Get weigh-ins error:', error)
    return NextResponse.json(
      { error: 'Failed to get weigh-ins' },
      { status: 500 }
    )
  }
}

// POST /api/weighins
async function createWeighIn(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = createWeighInSchema.parse(body)

    await dbConnect()

    const weighIn = await WeighIn.create({
      userId: req.user!.userId,
      date: new Date(data.date),
      weight: data.weight,
      note: data.note,
    })

    return NextResponse.json({ weighIn }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create weigh-in error:', error)
    return NextResponse.json(
      { error: 'Failed to create weigh-in' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getWeighIns)
export const POST = withAuth(createWeighIn)

