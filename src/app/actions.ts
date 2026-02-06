"use server"

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { redirect } from "next/navigation"
import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me"

async function verifyAdmin() {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
        const allCookies = cookieStore.getAll().map(c => c.name).join(', ')
        console.log(`Admin verification failed: No token found. Available cookies: [${allCookies}]`);
        return false
    }

    const secret = process.env.JWT_SECRET || "default_secret_key_change_me"
    try {
        jwt.verify(token, secret)
        return true
    } catch (e: any) {
        console.log("Admin verification failed: Invalid token", e.message);
        return false
    }
}

export async function loginAction(prevState: any, formData: FormData) {
    const password = formData.get("password") as string

    if (password === ADMIN_PASSWORD) {
        const secret = process.env.JWT_SECRET || "default_secret_key_change_me"
        const token = jwt.sign({ role: "admin" }, secret, { expiresIn: '7d' })

        const cookieStore = await cookies()

        // 使用更通用的配置
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',  // 跨子域更强兼容性，配合 secure: true
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

        return redirect("/") // 注意：在一些 Next.js 版本中，redirect 会抛出错误，必须在最后调用
    }

    return { error: "Invalid password" }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("admin_token")
    redirect("/")
}

export async function saveWidgetConfig(key: string, data: any) {
    try {
        const isAdmin = await verifyAdmin()
        if (!isAdmin) return { success: false, error: "Unauthorized" }

        if (!process.env.KV_REST_API_URL) {
            console.log("Mock saving config:", key, data)
            return { success: true, mock: true }
        }

        let currentConfig: any = await kv.get("widget_config")
        if (!currentConfig || typeof currentConfig !== 'object') {
            currentConfig = {}
        }
        currentConfig[key] = data
        await kv.set("widget_config", currentConfig)
        revalidatePath("/")
        return { success: true }
    } catch (e: any) {
        console.error("KV Error:", e)
        return { success: false, error: e.message || "Failed to save" }
    }
}

export async function saveLinksAction(data: any) {
    try {
        const isAdmin = await verifyAdmin()
        if (!isAdmin) return { success: false, error: "Unauthorized" }

        if (!process.env.KV_REST_API_URL) {
            console.log("Mock saving links:", JSON.stringify(data, null, 2))
            return { success: true, mock: true }
        }

        await kv.set("nav_links", data)
        revalidatePath("/")
        return { success: true }
    } catch (e: any) {
        console.error("KV Error (Links):", e)
        return { success: false, error: e.message || "Failed to save links" }
    }
}
