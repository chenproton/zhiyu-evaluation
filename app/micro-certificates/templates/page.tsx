"use client"

import { useState, useMemo, useRef } from "react"
import {
  Plus,
  Search,
  FileText,
  Pencil,
  Trash2,
  Settings,
  X,
  Check,
  ImageIcon,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { useData } from "@/components/providers/data-provider"
import type { MicroCertTemplate, MicroCertTemplateFormData, CertType } from "@/lib/types"

export default function MicroCertTemplatesPage() {
  const {
    microCertTemplates,
    certTypes,
    createMicroCertTemplate,
    updateMicroCertTemplate,
    deleteMicroCertTemplate,
    updateCertTypes,
  } = useData()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MicroCertTemplate | null>(null)
  const [typeConfigOpen, setTypeConfigOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<MicroCertTemplate | null>(null)

  const [formTitle, setFormTitle] = useState("")
  const [formCertTypeId, setFormCertTypeId] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formCoverUrl, setFormCoverUrl] = useState<string>("")
  const coverFileInputRef = useRef<HTMLInputElement>(null)

  const [editingTypes, setEditingTypes] = useState<CertType[]>([])
  const [newTypeName, setNewTypeName] = useState("")

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormTitle("")
    setFormCertTypeId("")
    setFormContent("")
    setFormCoverUrl("")
    setFormOpen(true)
  }

  const openEditDialog = (template: MicroCertTemplate) => {
    setEditingTemplate(template)
    setFormTitle(template.title)
    setFormCertTypeId(template.certTypeId)
    setFormContent(template.content)
    setFormCoverUrl(template.coverUrl || "")
    setFormOpen(true)
  }

  const openTypeConfig = () => {
    setEditingTypes([...certTypes])
    setNewTypeName("")
    setTypeConfigOpen(true)
  }

  const addCertType = () => {
    if (!newTypeName.trim()) return
    if (editingTypes.some((t) => t.name === newTypeName.trim())) {
      alert("该认证类型已存在")
      return
    }
    const newType: CertType = {
      id: `ct-${Date.now()}`,
      name: newTypeName.trim(),
    }
    setEditingTypes([...editingTypes, newType])
    setNewTypeName("")
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("文件大小不能超过 5MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件")
      return
    }
    setFormCoverUrl(URL.createObjectURL(file))
  }

  const removeCover = () => {
    setFormCoverUrl("")
    if (coverFileInputRef.current) coverFileInputRef.current.value = ""
  }

  const removeCertType = (id: string) => {
    setEditingTypes(editingTypes.filter((t) => t.id !== id))
  }

  const saveCertTypes = () => {
    updateCertTypes(editingTypes)
    setTypeConfigOpen(false)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formCertTypeId || !formContent.trim()) return

    const data: MicroCertTemplateFormData = {
      title: formTitle.trim(),
      certTypeId: formCertTypeId,
      content: formContent.trim(),
      coverUrl: formCoverUrl || undefined,
    }

    if (editingTemplate) {
      updateMicroCertTemplate(editingTemplate.id, data)
    } else {
      createMicroCertTemplate(data)
    }
    setFormOpen(false)
  }

  const handleDelete = () => {
    if (deletingTemplate) {
      deleteMicroCertTemplate(deletingTemplate.id)
      setDeleteOpen(false)
      setDeletingTemplate(null)
    }
  }

  const filteredTemplates = useMemo(() => {
    return microCertTemplates.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || t.certTypeId === typeFilter
      return matchSearch && matchType
    })
  }, [microCertTemplates, search, typeFilter])

  const stats = useMemo(() => {
    const typeCount = certTypes.length
    return [
      {
        label: "模板总数",
        value: microCertTemplates.length,
        icon: <FileText className="size-3.5 text-blue-600" />,
        iconClassName: "bg-blue-50",
      },
      {
        label: "认证类型",
        value: typeCount,
        icon: <Settings className="size-3.5 text-green-600" />,
        iconClassName: "bg-green-50",
      },
    ]
  }, [microCertTemplates, certTypes])

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="微证书模板管理"
        description="管理微证书模板，支持自定义证书内容和认证类型"
        stats={stats}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={openTypeConfig}>
              <Settings className="mr-1.5 size-4" />
              认证类型配置
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-1.5 size-4" />
              新建模板
            </Button>
          </>
        }
      />

      {/* Search & Filter */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="搜索模板标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="认证类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部类型</SelectItem>
              {certTypes.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">序号</TableHead>
              <TableHead>证书标题</TableHead>
              <TableHead className="w-[140px]">认证类型</TableHead>
              <TableHead className="w-[180px]">创建时间</TableHead>
              <TableHead className="w-[180px]">更新时间</TableHead>
              <TableHead className="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((t, idx) => (
                <TableRow key={t.id}>
                  <TableCell className="text-slate-500">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                      {t.certTypeName}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {t.createdAt.toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {t.updatedAt.toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(t)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-600"
                        onClick={() => {
                          setDeletingTemplate(t)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "编辑模板" : "新建模板"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "修改微证书模板信息" : "创建一个新的微证书模板"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <FieldGroup className="max-h-[70vh] overflow-y-auto py-4">
              <Field>
                <FieldLabel htmlFor="cert-title">证书标题</FieldLabel>
                <Input
                  id="cert-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入证书标题"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cert-type">认证类型</FieldLabel>
                <Select value={formCertTypeId} onValueChange={setFormCertTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择认证类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {certTypes.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          {ct.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>证书封面</FieldLabel>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                {formCoverUrl ? (
                  <div className="relative mt-2 w-full overflow-hidden rounded-lg border">
                    <img
                      src={formCoverUrl}
                      alt="封面预览"
                      className="h-40 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 size-6"
                      onClick={removeCover}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className="mt-2 flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50"
                  >
                    <Upload className="mb-2 size-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">点击上传证书封面</span>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="cert-content">证书内容（富文本）</FieldLabel>
                <Textarea
                  id="cert-content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="请输入证书内容（支持HTML富文本）"
                  rows={12}
                  className="font-mono text-sm"
                  required
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={!formTitle.trim() || !formCertTypeId || !formContent.trim()}>
                {editingTemplate ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除模板"{deletingTemplate?.title}"吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification Type Config Dialog */}
      <Dialog open={typeConfigOpen} onOpenChange={setTypeConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>认证类型字典配置</DialogTitle>
            <DialogDescription>
              自定义维护证书认证类型，修改后会影响模板中的类型选项
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="输入新类型名称"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCertType()
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={addCertType}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {editingTypes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">暂无认证类型</p>
              ) : (
                editingTypes.map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50"
                  >
                    <span className="text-sm">{ct.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-slate-400 hover:text-red-500"
                      onClick={() => removeCertType(ct.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeConfigOpen(false)}>
              取消
            </Button>
            <Button onClick={saveCertTypes}>
              <Check className="mr-1.5 size-4" />
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
