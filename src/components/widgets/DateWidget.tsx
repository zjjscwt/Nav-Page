"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock, Settings2, Save, X, Plus, Trash2, GripVertical } from "lucide-react"
import { differenceInDays, parseISO, format } from "date-fns"
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

interface EventItem {
    id: string
    name: string
    date: string // ISO string
}

interface DateConfig {
    events: EventItem[]
}

interface DateWidgetProps {
    isAdmin?: boolean
    initialConfig?: DateConfig
}

const DEFAULT_EVENTS: EventItem[] = [
    { id: "1", name: "2027 新年", date: "2027-01-01" },
    { id: "2", name: "项目发布", date: "2025-12-01" },
    { id: "3", name: "母亲生日", date: "2025-05-20" },
    { id: "4", name: "结婚纪念日", date: "2020-08-15" },
]

// Sortable Item Component (Edit Mode)
function SortableEventItem({
    event,
    onRemove,
    onUpdate
}: {
    event: EventItem,
    onRemove: (id: string) => void,
    onUpdate: (id: string, field: 'name' | 'date', value: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: event.id })

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
                "flex gap-3 items-center bg-muted/30 p-4 rounded-xl border border-border group/item transition-shadow",
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
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">事件名称</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={event.name}
                        onChange={(e) => onUpdate(event.id, 'name', e.target.value)}
                        placeholder="如: 生日"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">目标日期</label>
                    <input
                        type="date"
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={event.date}
                        onChange={(e) => onUpdate(event.id, 'date', e.target.value)}
                    />
                </div>
            </div>
            <button
                onClick={() => onRemove(event.id)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}

export function DateWidget({ isAdmin, initialConfig }: DateWidgetProps) {
    const safeConfig = initialConfig?.events ? initialConfig : { events: DEFAULT_EVENTS }
    const [config, setConfig] = useState<DateConfig>(safeConfig)
    const [isOpen, setIsOpen] = useState(false)
    const [editEvents, setEditEvents] = useState<EventItem[]>(safeConfig.events)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleSave = async () => {
        const newConfig = { events: editEvents }
        const oldConfig = config
        setConfig(newConfig)
        setIsOpen(false)
        try {
            const result = await saveWidgetConfig("date", newConfig)
            if (!result.success) {
                alert(`保存失败: ${result.error}`)
                setConfig(oldConfig)
            } else if (result.mock) {
                alert("提醒：由于未检测到 KV 环境变量，配置仅在本地模拟保存，刷新后将丢失。")
            }
        } catch (e: any) {
            console.error("Failed to save config", e)
            alert(`保存出错: ${e.message || "未知错误"}`)
            setConfig(oldConfig)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setEditEvents((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addEvent = () => {
        setEditEvents([...editEvents, { id: Date.now().toString(), name: "新事件", date: format(new Date(), 'yyyy-MM-dd') }])
    }

    const removeEvent = (id: string) => {
        setEditEvents(editEvents.filter(e => e.id !== id))
    }

    const updateEvent = (id: string, field: 'name' | 'date', value: string) => {
        setEditEvents(editEvents.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    return (
        <>
            <Card className="h-full flex flex-col relative group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" /> 倒数日
                        </span>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditEvents(config.events)
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
                    <div className="divide-y divide-border">
                        {config.events.map((event) => {
                            const date = parseISO(event.date)
                            const diff = differenceInDays(date, new Date())
                            const isPast = diff < 0
                            return (
                                <div key={event.id} className="flex items-center justify-between p-3 px-4 hover:bg-muted/50 transition-colors group/item">
                                    <div className="flex flex-col text-left">
                                        <span className="font-semibold text-sm text-foreground/90 group-hover/item:text-primary transition-colors">{event.name}</span>
                                        <span className="text-[10px] text-muted-foreground opacity-70 uppercase tracking-tight">{format(date, 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight shadow-sm ${isPast
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-primary/20 text-primary border border-primary/20"
                                        }`}>
                                        {isPast ? `${Math.abs(diff)} 天前` : `${diff} 天后`}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑倒数日</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={editEvents.map(e => e.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {editEvents.map((event) => (
                                        <SortableEventItem
                                            key={event.id}
                                            event={event}
                                            onRemove={removeEvent}
                                            onUpdate={updateEvent}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <button
                            onClick={addEvent}
                            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4" /> 添加重要日子
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
