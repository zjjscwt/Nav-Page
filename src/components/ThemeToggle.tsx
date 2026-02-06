"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="flex items-center gap-1 bg-white/10 dark:bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/20 dark:border-white/10 transition-all">
            <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all ${theme === "light"
                    ? "bg-white dark:bg-white/20 text-black dark:text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                title="明亮模式"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all ${theme === "dark"
                    ? "bg-white dark:bg-white/20 text-black dark:text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                title="黑暗模式"
            >
                <Moon className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-full transition-all ${theme === "system"
                    ? "bg-white dark:bg-white/20 text-black dark:text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                title="跟随系统"
            >
                <Monitor className="w-4 h-4" />
            </button>
        </div>
    )
}
