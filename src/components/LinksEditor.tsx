"use client"

import { useState } from "react"
import { ExternalLink, Edit2, Trash2, Plus, Save, X, FolderPlus, GripVertical } from "lucide-react"
import { saveLinksAction } from "@/app/actions"
import { cn } from "@/lib/utils"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface LinkItem {
    id: string
    title: string
    url: string
}

interface LinkGroupData {
    id?: string // Added ID for dnd
    category: string
    links: LinkItem[]
}

interface LinksEditorProps {
    initialLinks: LinkGroupData[]
    isAdmin?: boolean
}

function SortableLink({ id, groupId, isAdmin, children, isEditing }: { id: string, groupId: string, isAdmin: boolean, children: React.ReactNode, isEditing?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: id,
        data: { type: 'link', groupId },
        disabled: !isAdmin || isEditing
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group/link h-full">
            {children}
        </div>
    )
}

function SortableGroup({ id, isAdmin, children }: { id: string, isAdmin: boolean, children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: id,
        data: { type: 'group' },
        disabled: !isAdmin
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="mb-8 break-inside-avoid relative group/section">
            {isAdmin && (
                <div {...attributes} {...listeners} className="absolute -left-6 top-0 p-2 opacity-0 group-hover/section:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-opacity z-20">
                    <GripVertical className="w-4 h-4" />
                </div>
            )}
            {children}
        </div>
    )
}

export function LinksEditor({ initialLinks, isAdmin }: LinksEditorProps) {
    // Add IDs to groups if missing
    const [groups, setGroups] = useState<LinkGroupData[]>(() =>
        initialLinks.map((g, i) => ({ ...g, id: g.id || `group-${i}-${Date.now()}` }))
    )
    const [isSaving, setIsSaving] = useState(false)

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Edit States
    const [editingLink, setEditingLink] = useState<{ groupIdx: number, linkId: string, title: string, url: string } | null>(null)
    const [addingLinkToGroup, setAddingLinkToGroup] = useState<number | null>(null)
    const [newLinkState, setNewLinkState] = useState({ title: "", url: "" })

    // Category Management
    const [isAddingGroup, setIsAddingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [renamingGroupId, setRenamingGroupId] = useState<number | null>(null)
    const [tempCategoryName, setTempCategoryName] = useState("")

    const saveGroups = async (newGroups: LinkGroupData[]) => {
        setGroups(newGroups)
        setIsSaving(true)
        try {
            const result = await saveLinksAction(newGroups)
            if (!result.success) {
                alert(`保存失败: ${result.error}`)
            }
        } catch (e: any) {
            console.error(e)
            alert(`保存出错: ${e.message || "未知错误"}`)
        } finally {
            setIsSaving(false)
        }
    }

    // --- Link Operations ---

    const handleDeleteLink = (groupIdx: number, linkId: string) => {
        if (!confirm("确定删除此链接?")) return
        const newGroups = [...groups]
        newGroups[groupIdx].links = newGroups[groupIdx].links.filter(l => l.id !== linkId)
        saveGroups(newGroups)
    }

    const handleSaveEditLink = () => {
        if (!editingLink) return
        const newGroups = [...groups]
        const group = newGroups[editingLink.groupIdx]
        const linkIndex = group.links.findIndex(l => l.id === editingLink.linkId)
        if (linkIndex !== -1) {
            group.links[linkIndex] = { ...group.links[linkIndex], title: editingLink.title, url: editingLink.url }
            saveGroups(newGroups)
        }
        setEditingLink(null)
    }

    const handleAddLink = (groupIdx: number) => {
        if (!newLinkState.title || !newLinkState.url) return
        const newGroups = [...groups]
        newGroups[groupIdx].links.push({
            id: Date.now().toString(),
            title: newLinkState.title,
            url: newLinkState.url
        })
        saveGroups(newGroups)
        setAddingLinkToGroup(null)
        setNewLinkState({ title: "", url: "" })
    }

    // --- Group Operations ---

    const handleAddGroup = () => {
        if (!newGroupName) return
        const newGroups = [...groups, { category: newGroupName, links: [] }]
        saveGroups(newGroups)
        setIsAddingGroup(false)
        setNewGroupName("")
    }

    const handleDeleteGroup = (idx: number) => {
        if (groups[idx].links.length > 0) {
            if (!confirm(`确定删除分类 "${groups[idx].category}" 及其所有链接吗?`)) return
        }
        const newGroups = groups.filter((_, i) => i !== idx)
        saveGroups(newGroups)
    }

    const handleSaveRenameGroup = (idx: number) => {
        if (!tempCategoryName.trim()) return
        const newGroups = [...groups]
        newGroups[idx].category = tempCategoryName.trim()
        saveGroups(newGroups)
        setRenamingGroupId(null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        if (active.data.current?.type === 'group') {
            const oldIndex = groups.findIndex(g => g.id === active.id)
            const newIndex = groups.findIndex(g => g.id === over.id)
            saveGroups(arrayMove(groups, oldIndex, newIndex))
        } else if (active.data.current?.type === 'link') {
            const activeGroupId = active.data.current.groupId
            const overGroupId = over.data.current?.groupId

            if (activeGroupId === overGroupId) {
                const groupIdx = groups.findIndex(g => g.id === activeGroupId)
                const newGroups = [...groups]
                const oldLinkIndex = newGroups[groupIdx].links.findIndex(l => l.id === active.id)
                const newLinkIndex = newGroups[groupIdx].links.findIndex(l => l.id === over.id)
                newGroups[groupIdx].links = arrayMove(newGroups[groupIdx].links, oldLinkIndex, newLinkIndex)
                saveGroups(newGroups)
            }
        }
    }

    return (
        <div className="relative">
            {isSaving && (
                <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in-out">
                    保存中...
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-4">
                    <SortableContext items={groups.map(g => g.id!)} strategy={verticalListSortingStrategy}>
                        {groups.map((group, groupIdx) => (
                            <SortableGroup key={group.id} id={group.id!} isAdmin={isAdmin || false}>
                                <div className="mb-4 flex items-center gap-2">
                                    {renamingGroupId === groupIdx ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                className="text-lg font-semibold bg-muted/50 rounded px-2 py-0.5 outline-none border border-primary/50"
                                                value={tempCategoryName}
                                                onChange={e => setTempCategoryName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") handleSaveRenameGroup(groupIdx)
                                                    if (e.key === "Escape") setRenamingGroupId(null)
                                                }}
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveRenameGroup(groupIdx)} className="p-1 hover:bg-primary/10 rounded text-primary">
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setRenamingGroupId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-foreground/80 pl-1">
                                                {group.category}
                                            </h3>
                                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                            {isAdmin && (
                                                <div className="flex gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setRenamingGroupId(groupIdx)
                                                            setTempCategoryName(group.category)
                                                        }}
                                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                        title="重命名分类"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGroup(groupIdx)}
                                                        className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                                                        title="删除分类"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    <SortableContext items={group.links.map(l => l.id)} strategy={rectSortingStrategy}>
                                        {group.links.map(link => {
                                            const isEditingThis = editingLink?.linkId === link.id

                                            return (
                                                <SortableLink key={link.id} id={link.id} groupId={group.id!} isAdmin={isAdmin || false} isEditing={isEditingThis}>
                                                    {isEditingThis ? (
                                                        <div className="h-full bg-card border border-primary rounded-xl p-2 flex flex-col gap-2 shadow-lg z-10">
                                                            <input
                                                                className="bg-muted/50 rounded px-2 py-1 text-sm outline-none border border-transparent focus:border-primary/50"
                                                                value={editingLink!.title}
                                                                onChange={e => setEditingLink({ ...editingLink!, title: e.target.value })}
                                                                placeholder="标题"
                                                                autoFocus
                                                            />
                                                            <input
                                                                className="bg-muted/50 rounded px-2 py-1 text-xs outline-none border border-transparent focus:border-primary/50"
                                                                value={editingLink!.url}
                                                                onChange={e => setEditingLink({ ...editingLink!, url: e.target.value })}
                                                                placeholder="URL"
                                                            />
                                                            <div className="flex gap-1 mt-1">
                                                                <button onClick={handleSaveEditLink} className="flex-1 bg-primary text-primary-foreground rounded text-xs py-1">保存</button>
                                                                <button onClick={() => setEditingLink(null)} className="flex-1 bg-secondary rounded text-xs py-1">取消</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block h-full"
                                                                onClick={(e) => { if (isAdmin) e.preventDefault() }}
                                                            >
                                                                <div className="h-full bg-card hover:bg-secondary border border-border hover:border-primary/30 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group-hover/link:ring-1 ring-primary/20">
                                                                    <img
                                                                        src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`}
                                                                        alt=""
                                                                        className="w-6 h-6 rounded-md opacity-80 group-hover/link:opacity-100 transition-opacity"
                                                                        loading="lazy"
                                                                        onError={(e) => (e.currentTarget.src = "/globe.svg")}
                                                                    />
                                                                    <span className="text-sm font-medium truncate opacity-80 group-hover/link:opacity-100 group-hover/link:text-primary transition-all flex-1">
                                                                        {link.title}
                                                                    </span>
                                                                    {!isAdmin && <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-50 -translate-x-2 group-hover/link:translate-x-0 transition-all" />}
                                                                </div>
                                                            </a>
                                                            {isAdmin && (
                                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity bg-card shadow-sm rounded-lg p-1 border border-border/50 z-10">
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingLink({ groupIdx, linkId: link.id, title: link.title, url: link.url }) }}
                                                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                                        title="编辑"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteLink(groupIdx, link.id) }}
                                                                        className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                                                                        title="删除"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </SortableLink>
                                            )
                                        })}
                                    </SortableContext>

                                    {/* Add Button for this group */}
                                    {isAdmin && (
                                        addingLinkToGroup === groupIdx ? (
                                            <div className="col-span-1 bg-card border border-primary border-dashed rounded-xl p-2 flex flex-col gap-2 shadow-inner">
                                                <input
                                                    className="bg-background rounded px-2 py-1 text-sm outline-none border border-border focus:border-primary"
                                                    value={newLinkState.title}
                                                    onChange={e => setNewLinkState({ ...newLinkState, title: e.target.value })}
                                                    placeholder="名称"
                                                    autoFocus
                                                />
                                                <input
                                                    className="bg-background rounded px-2 py-1 text-xs outline-none border border-border focus:border-primary"
                                                    value={newLinkState.url}
                                                    onChange={e => setNewLinkState({ ...newLinkState, url: e.target.value })}
                                                    placeholder="https://..."
                                                />
                                                <div className="flex gap-1 mt-1">
                                                    <button onClick={() => handleAddLink(groupIdx)} className="flex-1 bg-primary text-primary-foreground rounded text-xs py-1">添加</button>
                                                    <button onClick={() => setAddingLinkToGroup(null)} className="flex-1 bg-secondary rounded text-xs py-1">取消</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingLinkToGroup(groupIdx)}
                                                className="flex items-center justify-center p-3 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all h-full min-h-[52px]"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        )
                                    )}
                                </div>
                            </SortableGroup>
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            {/* Add New Group Section */}
            {isAdmin && (
                <div className="mt-8 pb-12 border-t border-border/30 pt-8">
                    {isAddingGroup ? (
                        <div className="bg-card/50 p-4 rounded-xl border border-primary/30 max-w-md mx-auto flex flex-col gap-3">
                            <h4 className="font-medium">新建分类</h4>
                            <input
                                className="bg-background border border-input rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="分类名称 (如: 常用工具)"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleAddGroup} className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm hover:opacity-90">确认创建</button>
                                <button onClick={() => setIsAddingGroup(false)} className="flex-1 bg-secondary text-foreground py-2 rounded-md text-sm hover:opacity-90">取消</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingGroup(true)}
                            className="w-full py-4 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <FolderPlus className="w-5 h-5" /> 新建分类
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
