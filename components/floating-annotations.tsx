"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAnnotationEdit } from "@/lib/annotation-edit-context"
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
  DrawerClose,
} from "@/components/ui/drawer"
import { useState } from "react"

const CONTENT_TRUNCATE_LENGTH = 120

export function FloatingAnnotations() {
  const pathname = usePathname()
  const isLandingPage = pathname === "/landingpage" || pathname?.startsWith("/landingpage/")
  if (isLandingPage) return null

  const ctx = useAnnotationEdit()
  const { floatingAnnotations, isEditMode, deleteFloatingAnnotation, annotationsVisible } = ctx

  const pagePath = typeof window !== "undefined" ? window.location.pathname : ""

  const visible = useMemo(
    () => floatingAnnotations.filter((f) => f.pagePath === pagePath),
    [floatingAnnotations, pagePath]
  )

  if (visible.length === 0 || !annotationsVisible) return null

  return (
    <>
      {visible.map((fa) => (
        <FloatingAnnotationDot
          key={fa.id}
          data={fa}
          isEditMode={isEditMode}
          onDelete={() => deleteFloatingAnnotation(fa.id)}
        />
      ))}
    </>
  )
}

function FloatingAnnotationDot({
  data,
  isEditMode,
  onDelete,
}: {
  data: {
    id: string
    title: string
    content: string
    rect: { x: number; y: number; width: number; height: number }
  }
  isEditMode: boolean
  onDelete: () => void
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const hasLongContent = data.content.length > CONTENT_TRUNCATE_LENGTH

  // Recalculate position on each render to handle scroll/resize
  const style: React.CSSProperties = {
    position: "absolute",
    left: data.rect.x + data.rect.width - 6,
    top: data.rect.y + window.scrollY - 6,
    zIndex: 50,
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={cn(
              "absolute z-50 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full shadow-sm ring-2 ring-white transition-colors",
              isEditMode
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-amber-500 hover:bg-amber-600"
            )}
            style={style}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                isEditMode ? "bg-blue-400" : "bg-amber-400"
              )}
            />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0 overflow-hidden"
          align="end"
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 bg-amber-50 px-3 py-2 border-b border-amber-100">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-amber-800">
                {data.title}
              </span>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setPopoverOpen(false)
                }}
                className="rounded p-1 hover:bg-red-100 transition-colors"
                title="删除此标注"
              >
                <X className="h-3 w-3 text-red-500" />
              </button>
            )}
          </div>
          <div className="px-3 py-2.5">
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {hasLongContent
                ? data.content.slice(0, CONTENT_TRUNCATE_LENGTH) + "..."
                : data.content}
            </p>
            {hasLongContent && (
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false)
                  setDrawerOpen(true)
                }}
                className="mt-2 flex items-center gap-0.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                查看完整说明
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base">{data.title}</DrawerTitle>
              <DrawerClose asChild>
                <button className="rounded-md p-1 hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {data.content}
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
