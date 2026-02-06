"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function LoginPage() {
    const [state, action, isPending] = useActionState(loginAction, null)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            window.location.href = "/" // 使用原生跳转确保状态完全刷新
        }
    }, [state])

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
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                name="password"
                                type="password"
                                placeholder="输入管理员密码..."
                                className="w-full h-12 px-4 rounded-lg border border-input bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>
                        {state?.error && (
                            <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-2 rounded">
                                {state.error}
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
