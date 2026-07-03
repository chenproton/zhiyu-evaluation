"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Pencil, X, Download, Plus, MousePointerClick, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAnnotationEdit } from "@/lib/annotation-edit-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function AnnotationEditToolbar() {
  const pathname = usePathname()
  const isLandingPage = pathname === "/landingpage" || pathname?.startsWith("/landingpage/")
  if (isLandingPage) return null

  const ctx = useAnnotationEdit()
  const { isEditMode, toggleEditMode, exportOverrides, activeAddForm, setActiveAddForm, pendingElement, setPendingElement, addFloatingAnnotation, annotationsVisible, toggleAnnotationsVisible } = ctx

  const [showExport, setShowExport] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newId, setNewId] = useState("")

  // Enter edit mode: capture clicks on elements to add annotations
  useEffect(() => {
    if (!isEditMode || !activeAddForm) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore clicks on the toolbar, popovers, dialogs, and annotations
      if (
        target.closest("[data-annotation-toolbar]") ||
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest("[role='dialog']") ||
        target.closest(".annotation-dot")
      ) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      setPendingElement(target)

      // Suggest ID from element text or tag
      const text = target.textContent?.trim().slice(0, 20) || target.tagName.toLowerCase()
      const suggestedId = `custom-${text.replace(/\s+/g, "-").replace(/[^a-z0-9\-]/gi, "").toLowerCase()}-${Date.now().toString(36).slice(-4)}`
      setNewId(suggestedId)
      setNewTitle(text)
      setNewContent("")
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [isEditMode, activeAddForm, setPendingElement])

  const handleSaveNew = useCallback(() => {
    if (!pendingElement || !newId.trim()) return

    const rect = pendingElement.getBoundingClientRect()
    addFloatingAnnotation({
      id: newId.trim(),
      title: newTitle.trim() || "新标注",
      content: newContent.trim() || "暂无描述",
      selector: generateSelector(pendingElement),
      rect: { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
      pagePath: window.location.pathname,
    })

    setPendingElement(null)
    setNewTitle("")
    setNewContent("")
    setNewId("")
    setActiveAddForm(false)
  }, [pendingElement, newId, newTitle, newContent, addFloatingAnnotation, setPendingElement, setActiveAddForm])

  return (
    <>
      {/* Edit mode banner */}
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <span>标注编辑模式已开启</span>
            <span className="text-blue-200 text-xs ml-2">
              点击已有圆点可编辑 / 点击「添加标注」后点击页面元素可新增
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-blue-500 text-white hover:bg-blue-400 border-0"
              onClick={() => setActiveAddForm(!activeAddForm)}
            >
              {activeAddForm ? (
                <><X className="h-3 w-3 mr-1" />取消添加</>
              ) : (
                <><Plus className="h-3 w-3 mr-1" />添加标注</>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-blue-500 text-white hover:bg-blue-400 border-0"
              onClick={toggleAnnotationsVisible}
            >
              {annotationsVisible ? (
                <><EyeOff className="h-3 w-3 mr-1" />关闭所有标注</>
              ) : (
                <><Eye className="h-3 w-3 mr-1" />打开所有标注</>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-blue-500 text-white hover:bg-blue-400 border-0"
              onClick={() => setShowExport(true)}
            >
              <Download className="h-3 w-3 mr-1" />
              导出修改
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-blue-500 text-white hover:bg-blue-400 border-0"
              onClick={toggleEditMode}
            >
              <X className="h-3 w-3 mr-1" />
              退出编辑
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      {!isEditMode && (
        <div
          data-annotation-toolbar
          className="fixed bottom-6 right-6 z-[60]"
        >
          <button
            onClick={toggleEditMode}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
              "bg-slate-800 text-white hover:bg-slate-700"
            )}
            title="进入标注编辑模式"
          >
            <Pencil className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Add annotation dialog */}
      <Dialog open={!!pendingElement} onOpenChange={(open) => !open && setPendingElement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加新标注</DialogTitle>
            <DialogDescription>为选中的页面元素添加需求文档标注</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">标注 ID（唯一标识）</Label>
              <Input value={newId} onChange={(e) => setNewId(e.target.value)} className="h-8 text-sm mt-1" placeholder="例如: custom-button-submit" />
            </div>
            <div>
              <Label className="text-xs">标题</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">内容</Label>
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={4} className="text-xs mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPendingElement(null)}>取消</Button>
            <Button size="sm" onClick={handleSaveNew} disabled={!newId.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>导出标注修改</DialogTitle>
            <DialogDescription>复制下方 JSON 数据，可同步到代码文件中</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              readOnly
              value={exportOverrides()}
              className="w-full h-64 text-xs font-mono bg-slate-50 border rounded-md p-3 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowExport(false)}>关闭</Button>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(exportOverrides())
                setShowExport(false)
              }}
            >
              复制到剪贴板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Generate a simple CSS selector for an element */
function generateSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList)
    .filter((c) => !c.startsWith("_") && c.length < 30)
    .slice(0, 2)
    .join(".")
  if (classes) return `${tag}.${classes}`
  return tag
}
