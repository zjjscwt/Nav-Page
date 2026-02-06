"use server"

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { redirect } from "next/navigation"
import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET = process.env.JWT_SECRET

export async function getAdminStatus() {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    // 强制实时读取环境变量
    const secret = process.env.JWT_SECRET
    if (!secret) {
        console.error("[Auth] JWT_SECRET environment variable is not set!")
        return false
    }

    if (!token) {
        const allCookies = cookieStore.getAll().map(c => c.name).join(', ')
        console.log(`[Auth] No token found. Cookies in request: [${allCookies}]. JWT_SECRET length: ${secret.length}`);
        return false
    }

    try {
        jwt.verify(token, secret)
        return true
    } catch (e: any) {
        console.log(`[Auth] Token invalid. Reason: ${e.message}. Secret length used: ${secret.length}`);
        return false
    }
}

export async function loginAction(prevState: any, formData: FormData) {
    const password = formData.get("password") as string
    const adminPass = process.env.ADMIN_PASSWORD

    if (password === adminPass && adminPass) {
        const secret = process.env.JWT_SECRET
        if (!secret) {
            console.error("[Login] JWT_SECRET environment variable is not set!")
            return { error: "Server configuration error" }
        }
        const token = jwt.sign({ role: "admin" }, secret, { expiresIn: '7d' })

        const cookieStore = await cookies()
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

        console.log(`[Login] Success. Token created, cookie set.`)
        return { success: true }
    }

    console.log(`[Login] Failed. Input length: ${password?.length || 0}, Env length: ${adminPass?.length || 0}`)
    return { error: "Invalid password" }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("admin_token")
    redirect("/")
}

export async function saveWidgetConfig(key: string, data: any) {
    try {
        const isAdmin = await getAdminStatus()
        if (!isAdmin) return { success: false, error: "Unauthorized" }

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
        const isAdmin = await getAdminStatus()
        if (!isAdmin) return { success: false, error: "Unauthorized" }

        await kv.set("nav_links", data)
        revalidatePath("/")
        return { success: true }
    } catch (e: any) {
        console.error("KV Error (Links):", e)
        return { success: false, error: e.message || "Failed to save links" }
    }
}
