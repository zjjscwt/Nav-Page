"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Settings2, Save, X, Plus, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveWidgetConfig } from "@/app/actions"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface StockItem {
    id: string
    symbol: string
    name: string
}

interface StockConfig {
    stocks: StockItem[]
}

interface StockWidgetProps {
    isAdmin?: boolean
    initialConfig?: StockConfig
}

const DEFAULT_STOCKS: StockItem[] = [
    { id: "1", symbol: 'AAPL', name: 'Apple' },
    { id: "2", symbol: 'MSFT', name: 'Microsoft' },
    { id: "3", symbol: 'BTC-USD', name: 'Bitcoin' },
    { id: "4", symbol: 'TSLA', name: 'Tesla' },
]

// Single Stock Item Component (Display Mode)
function StockItemRow({ item }: { item: StockItem }) {
    const { data: quote, error, isLoading } = useSWR(
        `/api/stock?symbol=${item.symbol}`,
        (url) => fetch(url).then(res => res.json()),
        { refreshInterval: 60000 }
    )

    const isMissingKey = quote?.error === "MISSING_API_KEY";
    const price = quote?.c || 0;
    const change = quote?.d || 0;
    const percent = quote?.dp || 0;
    const isUp = change >= 0;
    const colorClass = isUp ? "text-red-500" : "text-green-500";

    return (
        <div className="flex items-center justify-between p-2 px-3 hover:bg-muted/30 transition-colors">
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate text-foreground/90" title={item.name}>{item.name}</span>
                <span className="text-[10px] leading-tight text-muted-foreground truncate font-medium uppercase tracking-tighter" title={item.symbol}>{item.symbol}</span>
            </div>
            <div className="text-right flex-1 ml-2 min-w-0">
                {isLoading ? (
                    <div className="flex flex-col items-end gap-1">
                        <div className="h-4 w-12 bg-muted/50 animate-pulse rounded" />
                        <div className="h-3 w-8 bg-muted/50 animate-pulse rounded" />
                    </div>
                ) : isMissingKey ? (
                    <div className="text-[10px] text-orange-400 font-medium whitespace-nowrap">需 Key</div>
                ) : error || quote?.error ? (
                    <div className="text-[10px] text-red-500">失败</div>
                ) : (
                    <>
                        <div className="font-mono font-medium text-sm text-foreground/90">
                            {price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : "---"}
                        </div>
                        <div className={cn("text-[10px] font-medium flex items-center justify-end gap-0.5", colorClass)}>
                            {isUp ? "+" : ""}{percent.toFixed(2)}%
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// Sortable Item Component (Edit Mode)
function SortableStockItem({
    stock,
    onRemove,
    onUpdate
}: {
    stock: StockItem,
    onRemove: (id: string) => void,
    onUpdate: (id: string, field: 'symbol' | 'name', value: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stock.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 60 : undefined,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex gap-3 items-center bg-muted/30 p-3 rounded-xl border border-border group/item transition-shadow",
                isDragging ? "shadow-2xl border-primary/50 bg-card/90" : ""
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                title="按住拖拽排序"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            <div className="space-y-3 flex-1">
                <div className="grid grid-cols-4 gap-2 items-center">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tighter col-span-1">代码</label>
                    <input
                        className="col-span-3 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={stock.symbol}
                        onChange={(e) => onUpdate(stock.id, 'symbol', e.target.value)}
                        placeholder="如: AAPL"
                    />
                </div>
                <div className="grid grid-cols-4 gap-2 items-center">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tighter col-span-1">名称</label>
                    <input
                        className="col-span-3 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={stock.name}
                        onChange={(e) => onUpdate(stock.id, 'name', e.target.value)}
                        placeholder="如: 苹果"
                    />
                </div>
            </div>
            <button
                onClick={() => onRemove(stock.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}

export function StockWidget({ isAdmin, initialConfig }: StockWidgetProps) {
    const safeConfig = initialConfig?.stocks ? initialConfig : { stocks: DEFAULT_STOCKS }
    const [config, setConfig] = useState<StockConfig>(safeConfig)
    const [isOpen, setIsOpen] = useState(false)
    const [editStocks, setEditStocks] = useState<StockItem[]>(safeConfig.stocks)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleSave = async () => {
        const newConfig = { stocks: editStocks }
        setConfig(newConfig)
        setIsOpen(false)
        try {
            await saveWidgetConfig("stock", newConfig)
        } catch (e) {
            console.error("Failed to save config", e)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setEditStocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addStock = () => {
        setEditStocks([...editStocks, { id: Date.now().toString(), symbol: 'AAPL', name: 'Apple' }])
    }

    const removeStock = (id: string) => {
        setEditStocks(editStocks.filter(s => s.id !== id))
    }

    const updateStock = (id: string, field: 'symbol' | 'name', value: string) => {
        setEditStocks(editStocks.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    return (
        <>
            <Card className="h-full flex flex-col relative group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> 市场行情
                        </span>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditStocks(config.stocks)
                                    setIsOpen(true)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
                    <div className="grid grid-cols-2 gap-3 p-3 pt-0">
                        {config.stocks.map((stock) => (
                            <div key={stock.id} className="bg-muted/30 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                                <StockItemRow item={stock} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑市场行情</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={editStocks.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {editStocks.map((stock) => (
                                        <SortableStockItem
                                            key={stock.id}
                                            stock={stock}
                                            onRemove={removeStock}
                                            onUpdate={updateStock}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <button
                            onClick={addStock}
                            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4" /> 添加行情指标
                        </button>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 shadow-lg shadow-primary/20"
                        >
                            保存更改
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
