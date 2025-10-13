import { NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

const updateSettingsSchema = z.object({
  unit: z.enum(['kg', 'lb']).optional(),
  timezone: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  bodyWeight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  targetWeight: z.number().positive().optional(),
  targetDays: z.number().positive().int().optional(),
  weeklyTargetDays: z.number().int().min(1).max(7).optional(),
  autoCheckIn: z.boolean().optional(),
})

// PUT /api/user/settings
async function updateSettings(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = updateSettingsSchema.parse(body)

    await dbConnect()

    // Build update object only for provided fields
    const updateFields: any = {}
    if (data.unit !== undefined) updateFields['settings.unit'] = data.unit
    if (data.timezone !== undefined) updateFields['settings.timezone'] = data.timezone
    if (data.equipment !== undefined) updateFields['settings.equipment'] = data.equipment
    if (data.theme !== undefined) updateFields['settings.theme'] = data.theme
    if (data.bodyWeight !== undefined) updateFields['settings.bodyWeight'] = data.bodyWeight
    if (data.height !== undefined) updateFields['settings.height'] = data.height
    if (data.targetWeight !== undefined) updateFields['settings.targetWeight'] = data.targetWeight
    if (data.targetDays !== undefined) updateFields['settings.targetDays'] = data.targetDays
    if (data.weeklyTargetDays !== undefined) updateFields['settings.weeklyTargetDays'] = data.weeklyTargetDays
  if (data.autoCheckIn !== undefined) updateFields['settings.autoCheckIn'] = data.autoCheckIn

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password_hash')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// GET /api/user/settings
async function getSettings(req: AuthenticatedRequest) {
  try {
    await dbConnect()

    const user = await User.findById(req.user!.userId).select('settings')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: user.settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(updateSettings)
export const PATCH = withAuth(updateSettings)
export const GET = withAuth(getSettings)
