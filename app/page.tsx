import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/calendar-view'

export default function Home() {
    // In a real app, check auth status server-side
    // For now, we'll handle this client-side

    return (
        <main className="flex min-h-screen flex-col">
            <CalendarView />
        </main>
    )
}


