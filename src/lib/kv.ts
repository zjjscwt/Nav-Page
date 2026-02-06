import { kv } from "@vercel/kv";
import { INITIAL_LINKS } from "./data";

export async function getLinksData() {
    try {
        if (!process.env.KV_REST_API_URL) return INITIAL_LINKS;
        const links = await kv.get("nav_links");
        // 关键修复：确保返回的一定是数组
        return Array.isArray(links) ? links : INITIAL_LINKS;
    } catch (error) {
        console.error("Failed to fetch links from KV:", error);
        return INITIAL_LINKS;
    }
}

export async function saveLinksData(data: any) {
    if (!process.env.KV_REST_API_URL) throw new Error("KV not configured");
    await kv.set("nav_links", data);
}

export async function getWidgetConfig() {
    try {
        if (!process.env.KV_REST_API_URL) return null;
        const config = await kv.get("widget_config");
        return (config && typeof config === 'object') ? config : null;
    } catch (error) {
        return null;
    }
}
