import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const cookieInfo = allCookies.map(c => ({
        name: c.name,
        value: c.name === "admin_token" ? c.value.substring(0, 20) + "..." : c.value.substring(0, 10) + "..."
    }))

    console.log(`[Debug] Cookies received:`, JSON.stringify(cookieInfo))

    return NextResponse.json({
        cookies: cookieInfo,
        hasAdminToken: allCookies.some(c => c.name === "admin_token")
    })
}
