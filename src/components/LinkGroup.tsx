import { ExternalLink, Edit2, Trash2, Plus } from "lucide-react"

interface LinkItem {
    id: string
    title: string
    url: string
}

interface LinkGroupProps {
    title: string
    links: LinkItem[]
    isAdmin?: boolean
}

export function LinkGroup({ title, links, isAdmin }: LinkGroupProps) {
    return (
        <div className="mb-8 break-inside-avoid">
            <h3 className="mb-4 text-lg font-semibold text-foreground/80 pl-1 flex items-center gap-2">
                {title}
                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent ml-2" />
                {isAdmin && (
                    <button className="p-1 hover:bg-primary/20 rounded text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {links.map(link => (
                    <div key={link.id} className="relative group">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-full"
                        >
                            <div className="h-full bg-card/40 backdrop-blur-sm hover:bg-card border border-border/40 hover:border-primary/30 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group-hover:ring-1 ring-primary/20">
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`}
                                    alt=""
                                    className="w-6 h-6 rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                />
                                <span className="text-sm font-medium truncate opacity-80 group-hover:opacity-100 group-hover:text-primary transition-all flex-1">{link.title}</span>
                                {!isAdmin && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />}
                            </div>
                        </a>
                        {isAdmin && (
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-sm rounded-lg p-1 border border-border/50">
                                <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary" title="Edit">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500" title="Delete">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {isAdmin && (
                    <button className="flex items-center justify-center p-3 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all h-full min-h-[52px]">
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    )
}
