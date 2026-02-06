import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()
        const adminPass = process.env.ADMIN_PASSWORD
        const secret = process.env.JWT_SECRET

        console.log(`[API Login] Attempt. Env vars present: ADMIN_PASSWORD=${!!adminPass}, JWT_SECRET=${!!secret}`)

        if (!secret) {
            console.error("[API Login] JWT_SECRET not set!")
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
        }

        if (!adminPass) {
            console.error("[API Login] ADMIN_PASSWORD not set!")
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
        }

        if (password !== adminPass) {
            console.log("[API Login] Password mismatch")
            return NextResponse.json({ error: "Invalid password" }, { status: 401 })
        }

        // Create token
        const token = jwt.sign({ role: "admin" }, secret, { expiresIn: '7d' })

        // Create response with cookie
        const response = NextResponse.json({ success: true })

        response.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        console.log(`[API Login] Success! Cookie set on response.`)
        return response

    } catch (e: any) {
        console.error("[API Login] Error:", e)
        return NextResponse.json({ error: e.message || "Login failed" }, { status: 500 })
    }
}
