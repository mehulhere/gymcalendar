'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Target } from 'lucide-react'

interface TargetWeightModalProps {
    onComplete: () => void
}

export function TargetWeightModal({ onComplete }: TargetWeightModalProps) {
    const { accessToken, user } = useAuthStore()
    const { toast } = useToast()
    const [targetWeight, setTargetWeight] = useState('')
    const [targetDays, setTargetDays] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!targetWeight || !targetDays) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetWeight: parseFloat(targetWeight),
                    targetDays: parseInt(targetDays),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save target')
            }

            toast({
                title: 'Target set!',
                description: 'Your weight goal has been saved.',
            })

            onComplete()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save target',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        onComplete()
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Set Your Goal</h2>
                        <p className="text-sm text-muted-foreground">Track your progress towards your target weight</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                        <Input
                            id="targetWeight"
                            type="number"
                            placeholder="e.g., 75"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            min="1"
                            step="0.1"
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetDays">Days to Achieve</Label>
                        <Input
                            id="targetDays"
                            type="number"
                            placeholder="e.g., 90"
                            value={targetDays}
                            onChange={(e) => setTargetDays(e.target.value)}
                            min="1"
                            step="1"
                            className="h-12"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Set Goal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
