import { Dumbbell } from 'lucide-react'

export function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative">
                <div className="absolute inset-0 gradient-emerald rounded-full opacity-20 blur-2xl animate-pulse" />
                <Dumbbell className="h-12 w-12 text-emerald-500 animate-float relative z-10" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-lg font-semibold text-foreground">Loading...</p>
                <p className="text-sm text-muted-foreground">Fetching your data</p>
            </div>
        </div>
    )
}

export function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-muted rounded-2xl" />
                <div className="h-24 bg-muted rounded-2xl" />
            </div>
            <div className="h-64 bg-muted rounded-3xl" />
        </div>
    )
}

export function LoadingDots() {
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
        </div>
    )
}

export function PageLoader() {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative">
                <div className="absolute inset-0 gradient-emerald rounded-full opacity-30 blur-3xl animate-pulse" />
                <div className="relative bg-card/95 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <Dumbbell className="h-16 w-16 text-emerald-500 animate-float" />
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">Loading</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
