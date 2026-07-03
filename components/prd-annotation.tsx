"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ChevronRight, X, HelpCircle, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer"
import { useAnnotationEdit } from "@/lib/annotation-edit-context"

export interface PrdAnnotationData {
  id: string
  title: string
  content: string
}

interface PrdAnnotationProps {
  annotationId?: string
  title?: string
  content?: string
  data?: PrdAnnotationData
  children: React.ReactNode
  className?: string
  dotClassName?: string
  placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

const CONTENT_TRUNCATE_LENGTH = 120

export function PrdAnnotation({
  annotationId,
  title,
  content,
  data,
  children,
  className,
  dotClassName,
  placement = "top-right",
}: PrdAnnotationProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const pathname = usePathname()
  const isLandingPage = pathname === "/landingpage" || pathname?.startsWith("/landingpage/")
  const editCtx = useAnnotationEdit()
  const isEditMode = editCtx?.isEditMode ?? false
  const annotationsVisible = editCtx?.annotationsVisible ?? true

  const finalTitle = data?.title ?? title ?? annotationId ?? "标注"
  const finalContent = data?.content ?? content ?? ""
  const hasLongContent = finalContent.length > CONTENT_TRUNCATE_LENGTH

  const handleOpenDrawer = useCallback(() => {
    setPopoverOpen(false)
    setDrawerOpen(true)
  }, [])

  const handleSaveEdit = useCallback(
    (newTitle: string, newContent: string) => {
      const id = data?.id ?? annotationId
      if (id && editCtx) {
        editCtx.saveOverride(id, { id, title: newTitle, content: newContent })
      }
      setIsEditing(false)
    },
    [data?.id, annotationId, editCtx]
  )

  const handleDelete = useCallback(() => {
    const id = data?.id ?? annotationId
    if (id && editCtx) {
      editCtx.deleteOverride(id)
    }
    setPopoverOpen(false)
    setIsEditing(false)
  }, [data?.id, annotationId, editCtx])

  const placementClasses = {
    "top-right": "-top-1.5 -right-1.5",
    "top-left": "-top-1.5 -left-1.5",
    "bottom-right": "-bottom-1.5 -right-1.5",
    "bottom-left": "-bottom-1.5 -left-1.5",
  }

  const dotColorClass = isEditMode
    ? "bg-blue-500 hover:bg-blue-600"
    : "bg-amber-500 hover:bg-amber-600"
  const pingColorClass = isEditMode ? "bg-blue-400" : "bg-amber-400"

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <div className={cn("relative", className)}>
          {children}
          {annotationsVisible && !isLandingPage && (
          <PopoverTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className={cn(
                "absolute z-10 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full shadow-sm ring-2 ring-white transition-colors",
                dotColorClass,
                placementClasses[placement],
                dotClassName
              )}
              aria-label={`查看「${finalTitle}」的需求说明`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  ;(e.target as HTMLElement).click()
                }
              }}
            >
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", pingColorClass)} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </PopoverTrigger>
          )}
        </div>
        <PopoverContent
          className="w-80 p-0 overflow-hidden"
          align="end"
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
        >
          {isEditMode && isEditing ? (
            <EditForm
              title={finalTitle}
              content={finalContent}
              onSave={handleSaveEdit}
              onDelete={handleDelete}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 bg-amber-50 px-3 py-2 border-b border-amber-100">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-sm font-medium text-amber-800">
                    {finalTitle}
                  </span>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    className="rounded p-1 hover:bg-amber-100 transition-colors"
                    title="编辑标注"
                  >
                    <Pencil className="h-3 w-3 text-amber-700" />
                  </button>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {hasLongContent
                    ? finalContent.slice(0, CONTENT_TRUNCATE_LENGTH) + "..."
                    : finalContent}
                </p>
                {hasLongContent && (
                  <button
                    type="button"
                    onClick={handleOpenDrawer}
                    className="mt-2 flex items-center gap-0.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    查看完整说明
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <DrawerTitle className="text-base">{finalTitle}</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <button
                  type="button"
                  className="rounded-md p-1 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </DrawerClose>
            </div>
            <DrawerDescription className="sr-only">
              需求文档标注详情
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {finalContent}
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function EditForm({
  title,
  content,
  onSave,
  onDelete,
  onCancel,
}: {
  title: string
  content: string
  onSave: (title: string, content: string) => void
  onDelete: () => void
  onCancel: () => void
}) {
  const [editTitle, setEditTitle] = useState(title)
  const [editContent, setEditContent] = useState(content)

  return (
    <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div>
        <Label className="text-xs">标题</Label>
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="h-8 text-sm mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">内容</Label>
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="text-xs mt-1"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => onSave(editTitle, editContent)}
        >
          保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          删除
        </Button>
      </div>
    </div>
  )
}
