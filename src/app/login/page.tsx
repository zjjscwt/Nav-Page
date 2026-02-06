import { signIn, auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    // 如果已登录，重定向到首页
    const session = await auth()
    if (session) {
        redirect("/")
    }

    const params = await searchParams
    const error = params.error

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />

            <Card className="w-full max-w-md bg-card/50 backdrop-blur-md border border-border/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Github className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">管理员登录</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        使用 GitHub 账号登录以管理导航页
                    </p>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-3 rounded mb-4">
                            {error === "AccessDenied"
                                ? "您的账号不在管理员列表中"
                                : "登录失败，请重试"}
                        </div>
                    )}
                    <form
                        action={async () => {
                            "use server"
                            await signIn("github", { redirectTo: "/" })
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full h-12 rounded-lg bg-[#24292f] text-white font-semibold hover:bg-[#24292f]/90 transition-opacity flex items-center justify-center gap-3"
                        >
                            <Github className="w-5 h-5" />
                            使用 GitHub 登录
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
