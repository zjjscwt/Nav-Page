"use client"

import { useState } from "react"
import { Search } from "lucide-react"

const ENGINES = [
    { name: "Google", url: "https://www.google.com/search?q=" },
    { name: "Bing", url: "https://www.bing.com/search?q=" },
    { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
    { name: "GitHub", url: "https://github.com/search?q=" },
]

export function SearchBar() {
    const [query, setQuery] = useState("")
    const [engine, setEngine] = useState(ENGINES[0])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        window.location.href = `${engine.url}${encodeURIComponent(query)}`
    }

    return (
        <div className="w-full max-w-2xl mx-auto my-4 relative z-10">
            <form onSubmit={handleSearch} className="relative flex items-center group">
                <div className="absolute left-4 z-20">
                    <select
                        value={engine.name}
                        onChange={(e) => setEngine(ENGINES.find(eng => eng.name === e.target.value) || ENGINES[0])}
                        className="bg-transparent border-none text-muted-foreground text-sm font-medium focus:ring-0 cursor-pointer outline-none appearance-none hover:text-foreground transition-colors pr-4"
                        style={{ backgroundImage: 'none' }}
                    >
                        {ENGINES.map(e => <option key={e.name} value={e.name} className="text-foreground bg-popover/90">{e.name}</option>)}
                    </select>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`搜索...`}
                    className="w-full h-14 pl-28 pr-14 rounded-2xl border border-border bg-card/50 backdrop-blur-xl text-lg shadow-sm transition-all duration-300 focus:shadow-xl focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                />
                <button
                    type="submit"
                    className="absolute right-3 p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                    aria-label="Search"
                >
                    <Search className="w-6 h-6" />
                </button>
            </form>
        </div>
    )
}
