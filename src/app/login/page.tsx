"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function LoginPage() {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsPending(true)

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
                credentials: "include" // Important for cookies
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Login failed")
                setIsPending(false)
                return
            }

            if (data.success) {
                // Use full page reload to ensure cookies are properly sent
                window.location.href = "/"
            }
        } catch (e: any) {
            setError(e.message || "Network error")
            setIsPending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-md border border-border/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">管理员登录</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                name="password"
                                type="password"
                                placeholder="输入管理员密码..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-input bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isPending ? "验证中..." : "进入系统"}
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
