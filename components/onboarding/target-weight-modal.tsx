'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Target, Sparkles } from 'lucide-react'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <div className="relative bg-card/95 border border-border/60 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_18px_50px_rgba(15,118,110,0.25)]">
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-emerald-500/10 pointer-events-none" />
                <div className="relative flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Target className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Set Your Goal</h2>
                        <p className="text-sm text-muted-foreground">
                            Dial in your target weight and timeline to stay focused on progress.
                        </p>
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
                            className="h-12 border-border/50 bg-background/80 focus-visible:ring-emerald-500"
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
                            className="h-12 border-border/50 bg-background/80 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            className="flex-1 border-border/50 bg-background/70 hover:bg-background/80 text-muted-foreground"
                            disabled={isSubmitting}
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-500/90 hover:to-emerald-600/90"
                            disabled={isSubmitting}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                {isSubmitting ? 'Saving...' : 'Set Goal'}
                            </span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
