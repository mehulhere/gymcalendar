'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const login = useAuthStore((state) => state.login)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

    console.log(process.env.NEXT_PUBLIC_APP_URL)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            login(data.accessToken, data.user)
            toast({
                title: 'Welcome back!',
                description: 'You have successfully logged in.',
            })
            router.push('/')
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to log in',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        try {
            // Redirect to Google OAuth
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/google`)}&` +
                `response_type=code&` +
                `scope=openid%20email%20profile&` +
                `access_type=offline`

            window.location.href = googleAuthUrl
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to initiate Google login',
                variant: 'destructive',
            })
            setIsGoogleLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            toast({
                title: 'Email Required',
                description: 'Please enter your email address first',
                variant: 'destructive',
            })
            return
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email')
            }

            toast({
                title: 'Reset Email Sent',
                description: data.message,
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send reset email',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Login</CardTitle>
                    <CardDescription>
                        Enter your email and password to access your account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="touch-target"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="touch-target"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full touch-target-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full touch-target-lg"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                        >
                            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                        </Button>

                        <div className="flex flex-col space-y-2 text-sm text-center">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-primary hover:underline"
                            >
                                Forgot your password?
                            </button>
                            <p className="text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link href="/auth/signup" className="text-primary hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

