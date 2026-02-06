"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Settings2, Save, X, Plus, Trash2, ArrowRight, GripVertical } from "lucide-react"
import { saveWidgetConfig } from "@/app/actions"
import { cn } from "@/lib/utils"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface CurrencyPair {
    id: string
    base: string
    target: string
}

interface ExchangeConfig {
    pairs: CurrencyPair[]
}

interface ExchangeRateWidgetProps {
    isAdmin?: boolean
    initialConfig?: ExchangeConfig
}

const DEFAULT_CONFIG: ExchangeConfig = {
    pairs: [
        { id: "1", base: "USD", target: "CNY" },
        { id: "2", base: "USD", target: "JPY" },
        { id: "3", base: "CNY", target: "PHP" },
        { id: "4", base: "USD", target: "PHP" },
    ]
}

// Single Rate Item Component (Display Mode)
function RateItem({ base, target }: { base: string, target: string }) {
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${target}`
    const { data, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 60000 })

    const rate = data?.rates?.[target]

    return (
        <div className="flex flex-col p-3 transition-all cursor-default h-full justify-between">
            <div className="flex justify-between items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted px-1.5 py-0.5 rounded leading-none">{base}</span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted px-1.5 py-0.5 rounded leading-none">{target}</span>
            </div>
            <div className="mt-2 text-right">
                {isLoading ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded ml-auto" />
                ) : error ? (
                    <span className="text-[10px] text-red-500 font-medium">Error</span>
                ) : rate ? (
                    <span className="text-xl font-bold tracking-tighter text-foreground/90">{rate.toFixed(3)}</span>
                ) : (
                    <span className="text-xl font-bold tracking-tighter text-muted-foreground/30">---</span>
                )}
            </div>
        </div>
    )
}

// Sortable Item Component (Edit Mode)
function SortablePairItem({
    pair,
    onRemove,
    onUpdate
}: {
    pair: CurrencyPair,
    onRemove: (id: string) => void,
    onUpdate: (id: string, field: 'base' | 'target', value: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: pair.id })

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
                "flex gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border group/item transition-shadow",
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

            <div className="flex gap-2 items-center flex-1">
                <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">持有货币</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={pair.base}
                        maxLength={3}
                        onChange={(e) => onUpdate(pair.id, 'base', e.target.value)}
                    />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-5" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">目标货币</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={pair.target}
                        maxLength={3}
                        onChange={(e) => onUpdate(pair.id, 'target', e.target.value)}
                    />
                </div>
            </div>
            <button
                onClick={() => onRemove(pair.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}

export function ExchangeRateWidget({ isAdmin, initialConfig }: ExchangeRateWidgetProps) {
    const safeConfig = initialConfig?.pairs ? initialConfig : DEFAULT_CONFIG
    const [config, setConfig] = useState<ExchangeConfig>(safeConfig)
    const [isOpen, setIsOpen] = useState(false)
    const [editPairs, setEditPairs] = useState<CurrencyPair[]>(safeConfig.pairs)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleSave = async () => {
        const newConfig = { pairs: editPairs }
        setConfig(newConfig)
        setIsOpen(false)
        try {
            await saveWidgetConfig("exchange", newConfig)
        } catch (e) {
            console.error("Failed to save config", e)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setEditPairs((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addPair = () => {
        setEditPairs([...editPairs, { id: Date.now().toString(), base: "USD", target: "CNY" }])
    }

    const removePair = (id: string) => {
        setEditPairs(editPairs.filter(p => p.id !== id))
    }

    const updatePair = (id: string, field: 'base' | 'target', value: string) => {
        setEditPairs(editPairs.map(p => p.id === id ? { ...p, [field]: value.toUpperCase() } : p))
    }

    return (
        <>
            <Card className="h-full flex flex-col relative group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> 汇率监控
                        </span>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditPairs(config.pairs)
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
                        {config.pairs.map((pair) => (
                            <div key={pair.id} className="bg-muted/30 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors">
                                <RateItem base={pair.base} target={pair.target} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑汇率监控</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={editPairs.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {editPairs.map((pair) => (
                                        <SortablePairItem
                                            key={pair.id}
                                            pair={pair}
                                            onRemove={removePair}
                                            onUpdate={updatePair}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <button
                            onClick={addPair}
                            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4" /> 添加交易对
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
