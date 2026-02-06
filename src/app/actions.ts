"use server"

import { auth } from "@/auth"
import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export async function getAdminStatus() {
    try {
        const session = await auth()
        const isLoggedIn = !!session?.user
        console.log(`[Auth] Session check: ${isLoggedIn ? `Logged in as ${session?.user?.name}` : "Not logged in"}`)
        return isLoggedIn
    } catch (e: any) {
        console.error("[Auth] Error checking session:", e.message)
        return false
    }
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
