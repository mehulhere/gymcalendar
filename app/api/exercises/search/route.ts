import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Exercise } from '@/lib/models/Exercise'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')

    await dbConnect()

    if (!query || query.trim().length === 0) {
      // Return all exercises if no query
      const exercises = await Exercise.find()
        .select('name equipment primary_muscles secondary_muscles category')
        .limit(100)
        .lean()

      return NextResponse.json({ exercises })
    }

    // Search by name or aliases using text search and regex
    const exercises = await Exercise.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { aliases: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name aliases equipment primary_muscles secondary_muscles category youtube_query_override')
      .limit(50)
      .lean()

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Exercise search error:', error)
    return NextResponse.json(
      { error: 'Failed to search exercises' },
      { status: 500 }
    )
  }
}

