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
    if (!token) return false
    try {
        jwt.verify(token, JWT_SECRET)
        return true
    } catch {
        return false
    }
}

export async function loginAction(prevState: any, formData: FormData) {
    const password = formData.get("password") as string

    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: '7d' })
        const cookieStore = await cookies()
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
        })
        redirect("/")
    }

    return { error: "Invalid password" }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("admin_token")
    redirect("/")
}

export async function saveWidgetConfig(key: string, data: any) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

    if (!process.env.KV_REST_API_URL) {
        // In local dev without KV, we might just log or fail silently/gracefully
        console.log("Mock saving config:", key, data)
        return { success: true, mock: true }
    }

    try {
        const currentConfig = (await kv.get("widget_config")) as Record<string, any> || {}
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
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

    if (!process.env.KV_REST_API_URL) {
        console.log("Mock saving links:", JSON.stringify(data, null, 2))
        return { success: true, mock: true }
    }

    try {
        await kv.set("nav_links", data)
        revalidatePath("/")
        return { success: true }
    } catch (e: any) {
        console.error("KV Error (Links):", e)
        return { success: false, error: e.message || "Failed to save links" }
    }
}
