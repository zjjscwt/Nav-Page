import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

// 允许的 GitHub 用户名列表（只有这些用户可以作为管理员）
const ALLOWED_ADMINS = process.env.ALLOWED_GITHUB_USERS?.split(",").map(s => s.trim().toLowerCase()) || []

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, profile }) {
            // 只允许特定 GitHub 用户登录
            const username = (profile as any)?.login?.toLowerCase()
            console.log(`[Auth] GitHub login attempt: ${username}`)

            if (ALLOWED_ADMINS.length === 0) {
                console.log("[Auth] No ALLOWED_GITHUB_USERS set, allowing all users")
                return true
            }

            if (username && ALLOWED_ADMINS.includes(username)) {
                console.log(`[Auth] User ${username} is allowed`)
                return true
            }

            console.log(`[Auth] User ${username} is NOT in allowed list: ${ALLOWED_ADMINS.join(", ")}`)
            return false
        },
        async session({ session, token }) {
            // 添加用户名到 session
            if (token.sub) {
                session.user.id = token.sub
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    trustHost: true,
})
