import { kv } from "@vercel/kv";
import { INITIAL_LINKS } from "./data";

export async function getLinksData() {
    try {
        if (!process.env.KV_REST_API_URL) return INITIAL_LINKS;
        const links = await kv.get("nav_links");
        return links || INITIAL_LINKS;
    } catch (error) {
        console.error("Failed to fetch links from KV:", error);
        return INITIAL_LINKS;
    }
}

export async function saveLinksData(data: any) {
    if (!process.env.KV_REST_API_URL) throw new Error("KV not configured");
    await kv.set("nav_links", data);
}

// Widget configs could be similar
export async function getWidgetConfig() {
    try {
        if (!process.env.KV_REST_API_URL) return null;
        return await kv.get("widget_config");
    } catch (error) {
        return null;
    }
}
