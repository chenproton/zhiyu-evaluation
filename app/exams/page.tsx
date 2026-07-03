"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Settings, FolderTree, Upload, List, LayoutGrid, FileText, RotateCcw, GitBranch, ArrowUpFromLine, CheckCircle2, Send, Undo2, ArrowDownFromLine, Copy, Trash2, Download, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { ExamFormDialog } from "@/components/exams/exam-form-dialog"
import { ExamStatusActions } from "@/components/exams/exam-status-actions"
import { InviteCollaboratorDialog } from "@/components/shared/invite-collaborator-dialog"
import { useData } from "@/components/providers/data-provider"
import type { Exam, Status, ExamFormData } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/types"
import { mockUsers, mockBatches } from "@/lib/mock-data"
import { PrdAnnotation } from "@/components/prd-annotation"
import { getAnnotation } from "@/lib/prd-annotations"
import { cn } from "@/lib/utils"

type OwnerTab = 'mine' | 'collaborate' | 'public'
type ViewMode = 'list' | 'batch'

export default function ExamsPage() {
  const router = useRouter()
  const {
    exams,
    createExam,
    updateExam,
    deleteExam,
    updateExamStatus,
  } = useData()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all")
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invitingExam, setInvitingExam] = useState<Exam | null>(null)
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('mine')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState(false)
  const [batchMoveTarget, setBatchMoveTarget] = useState<string>("")

  const filteredExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const q = search.toLowerCase().trim()
        const matchSearch = !q || exam.name.toLowerCase().includes(q) || exam.description.toLowerCase().includes(q)
        const matchStatus = statusFilter === "all" || exam.status === statusFilter
        const matchOwner = exam.ownerType === ownerTab
        const matchBatch = batchFilter === "all" || exam.batchId === batchFilter
        return matchSearch && matchStatus && matchOwner && matchBatch
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }, [exams, search, statusFilter, batchFilter, ownerTab])

  const stats = useMemo(() => {
    const total = exams.length
    const draftCount = exams.filter(e => e.status === 'draft' || e.status === 'unsubmitted').length
    const pendingCount = exams.filter(e => e.status === 'pending').length
    const toPublishCount = exams.filter(e => e.status === 'toPublish').length
    const publishedCount = exams.filter(e => e.status === 'published').length

    return [
      { label: "试卷总数", value: total, icon: <FileText className="size-3.5 text-blue-600" />, iconClassName: "bg-blue-50" },
      { label: "草稿", value: draftCount, icon: <RotateCcw className="size-3.5 text-gray-600" />, iconClassName: "bg-gray-50" },
      { label: "审批中", value: pendingCount, icon: <GitBranch className="size-3.5 text-yellow-600" />, iconClassName: "bg-yellow-50" },
      { label: "待发布", value: toPublishCount, icon: <ArrowUpFromLine className="size-3.5 text-amber-600" />, iconClassName: "bg-amber-50" },
      { label: "已发布", value: publishedCount, icon: <CheckCircle2 className="size-3.5 text-green-600" />, iconClassName: "bg-green-50" },
    ]
  }, [exams])

  const handleFormSubmit = (data: ExamFormData) => {
    if (editingExam) {
      updateExam(editingExam.id, data)
    } else {
      const newExam = createExam(data)
      router.push(`/exams/${newExam.id}`)
    }
    setEditingExam(null)
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormOpen(true)
  }

  const handleInvite = (exam: Exam) => {
    setInvitingExam(exam)
    setInviteOpen(true)
  }

  const handleInviteSubmit = (users: { userId: string; role: 'editor' | 'viewer' }[]) => {
    console.log('邀请用户:', users, '到试卷:', invitingExam?.name)
    setInvitingExam(null)
  }

  const handleCloneExam = (exam: Exam) => {
    const newExam = createExam({
      name: `${exam.name}（克隆）`,
      description: exam.description,
      duration: exam.duration,
      coverUrl: exam.coverUrl,
      batchId: exam.batchId,
      collaboratorIds: [],
      collaboratorDeptIds: [],
    })

    const clonedQuestions = exam.questions.map((q, index) => ({
      ...q,
      id: `eq-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    }))

    updateExam(newExam.id, {
      questions: clonedQuestions,
      totalScore: exam.totalScore,
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getCreatorName = (exam: Exam) => {
    return mockUsers.find(u => u.id === exam.creatorId)?.name || '-'
  }

  const getCollaborators = (exam: Exam) => {
    const users = (exam.collaboratorIds || []).map(id => mockUsers.find(u => u.id === id)?.name).filter(Boolean)
    return users.length > 0 ? users.join('、') : '-'
  }

  const getBatchName = (exam: Exam) => {
    return mockBatches.find(b => b.id === exam.batchId)?.name || '-'
  }

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((sid) => sid !== id)))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredExams.map((e) => e.id))
    } else {
      setSelectedIds([])
    }
  }

  const selectedExams = exams.filter((e) => selectedIds.includes(e.id))
  const hasSelected = selectedIds.length > 0

  const canBatchSubmit = selectedExams.some((e) => e.status === "draft" || e.status === "rejected" || e.status === "unsubmitted")
  const canBatchWithdraw = selectedExams.some((e) => e.status === "pending")
  const canBatchPublish = selectedExams.some((e) => e.status === "toPublish")
  const canBatchUnpublish = selectedExams.some((e) => e.status === "published")
  const canBatchDelete = selectedExams.some((e) => e.status === "draft" || e.status === "rejected" || e.status === "unsubmitted")

  const handleBatchSubmitApproval = () => {
    selectedIds.forEach((id) => updateExamStatus(id, "submit"))
    setSelectedIds([])
  }

  const handleBatchWithdrawApproval = () => {
    selectedIds.forEach((id) => updateExamStatus(id, "withdraw"))
    setSelectedIds([])
  }

  const handleBatchPublish = () => {
    selectedIds.forEach((id) => updateExamStatus(id, "publish"))
    setSelectedIds([])
  }

  const handleBatchUnpublish = () => {
    selectedIds.forEach((id) => updateExamStatus(id, "unpublish"))
    setSelectedIds([])
  }

  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个试卷吗？`)) {
      selectedIds.forEach((id) => deleteExam(id))
      setSelectedIds([])
    }
  }

  const handleBatchClone = () => {
    selectedExams.forEach((exam) => handleCloneExam(exam))
    setSelectedIds([])
  }

  const handleBatchMove = () => {
    if (!batchMoveTarget) return
    selectedIds.forEach((id) => updateExam(id, { batchId: batchMoveTarget }))
    setBatchMoveTarget("")
    setIsBatchMoveDialogOpen(false)
    setSelectedIds([])
  }

  const handleBatchExport = () => {
    setIsExportDialogOpen(true)
  }

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="试卷管理"
        description="管理所有试卷，进行组卷操作"
        stats={stats}
        actions={
          <>
            <PrdAnnotation data={getAnnotation("exam-btn-config-approval")}>
              <Button variant="outline">
                <Settings className="mr-2 size-4" />
                配置审批流程
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("exam-btn-config-batch")}>
              <Button variant="outline">
                <FolderTree className="mr-2 size-4" />
                配置批次分组
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("exam-btn-import")}>
              <Button variant="outline">
                <Upload className="mr-2 size-4" />
                导入试卷
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("exam-btn-create")}>
              <Button onClick={() => { setEditingExam(null); setFormOpen(true) }}>
                <Plus className="mr-2 size-4" />
                新建试卷
              </Button>
            </PrdAnnotation>
          </>
        }
        className="mb-4"
      />

      {/* Tab 切换与视图切换 */}
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={ownerTab} onValueChange={(v) => setOwnerTab(v as OwnerTab)}>
          <TabsList>
            <TabsTrigger value="mine">我的试卷</TabsTrigger>
            <TabsTrigger value="collaborate">共建试卷</TabsTrigger>
            <TabsTrigger value="public">公共试卷</TabsTrigger>
          </TabsList>
        </Tabs>
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="list" aria-label="资源列表">
            <List className="size-4" />
            <span className="ml-1.5">资源列表</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="batch" aria-label="批次分组">
            <LayoutGrid className="size-4" />
            <span className="ml-1.5">批次分组</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索试卷名称或试卷简介..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部状态</SelectItem>
              {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部批次" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部批次</SelectItem>
              {mockBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* 试卷列表 */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={filteredExams.length > 0 && filteredExams.every((e) => selectedIds.includes(e.id)) ? true : selectedExams.some((e) => filteredExams.map((fe) => fe.id).includes(e.id)) ? "indeterminate" : false}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    aria-label="全选"
                  />
                </TableHead>
                <TableHead className="w-[180px]">
                  <PrdAnnotation data={getAnnotation("exam-col-name")}>试卷名称</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[200px]">
                  <PrdAnnotation data={getAnnotation("exam-col-desc")}>试卷简介</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[80px]">
                  <PrdAnnotation data={getAnnotation("exam-col-question-count")}>题目数量</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[80px]">
                  <PrdAnnotation data={getAnnotation("exam-col-total-score")}>总分</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[120px]">
                  <PrdAnnotation data={getAnnotation("exam-col-batch")}>所属批次</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("exam-col-creator")}>创建人</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[140px]">
                  <PrdAnnotation data={getAnnotation("exam-col-collaborators")}>共建人</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("exam-col-status")}>状态</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[130px]">创建时间</TableHead>
                <TableHead className="w-[130px]">更新时间</TableHead>
                <TableHead className="sticky right-0 w-[80px] bg-white text-right">
                  <PrdAnnotation data={getAnnotation("exam-col-actions")}>操作</PrdAnnotation>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  {exams.length === 0 ? "暂无试卷，点击上方按钮创建" : "没有找到匹配的试卷"}
                </TableCell>
              </TableRow>
            ) : (
              filteredExams.map((exam) => {
                const isSelected = selectedIds.includes(exam.id)
                return (
                  <TableRow key={exam.id} className={cn("group", isSelected && "bg-primary/5")}>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectId(exam.id, checked === true)}
                        aria-label={`选择 ${exam.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer font-medium hover:underline"
                        onClick={() => router.push('/landingpage/resources/exams/exam-1?returnUrl=' + encodeURIComponent('/exams'))}
                      >
                        {exam.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {exam.description ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">{exam.description}</p>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{exam.questions.length}</TableCell>
                    <TableCell>{exam.totalScore} 分</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getBatchName(exam)}</TableCell>
                    <TableCell>{getCreatorName(exam)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getCollaborators(exam)}</TableCell>
                    <TableCell>
                      <StatusBadge status={exam.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(exam.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(exam.updatedAt)}</TableCell>
                    <TableCell className="sticky right-0 bg-white text-right relative">
                      <ExamStatusActions
                        status={exam.status}
                        onEdit={() => handleEdit(exam)}
                        onDelete={() => deleteExam(exam.id)}
                        onStatusChange={(action) => updateExamStatus(exam.id, action)}
                        onView={() => router.push(`/exams/${exam.id}`)}
                        onPreview={() => router.push('/landingpage/resources/exams/exam-1?returnUrl=' + encodeURIComponent('/exams'))}
                        onInvite={() => handleInvite(exam)}
                        onClone={() => handleCloneExam(exam)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        </div>
        {/* 批量操作工具栏 */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 mt-3">
          <span className={cn("text-xs mr-1", hasSelected ? "text-slate-700 font-medium" : "text-slate-400")}>
            {hasSelected ? `已选择 ${selectedIds.length} 项：` : "请选择试卷："}
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected || !canBatchSubmit} onClick={handleBatchSubmitApproval}>
            <Send className="mr-1 h-3 w-3" />
            提交审批
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected || !canBatchWithdraw} onClick={handleBatchWithdrawApproval}>
            <Undo2 className="mr-1 h-3 w-3" />
            撤回审批
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected || !canBatchPublish} onClick={handleBatchPublish}>
            <ArrowUpFromLine className="mr-1 h-3 w-3" />
            发布
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected || !canBatchUnpublish} onClick={handleBatchUnpublish}>
            <ArrowDownFromLine className="mr-1 h-3 w-3" />
            取消发布
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected || !canBatchDelete} onClick={handleBatchDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            删除
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected} onClick={handleBatchClone}>
            <Copy className="mr-1 h-3 w-3" />
            克隆
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected} onClick={() => setIsBatchMoveDialogOpen(true)}>
            <FolderKanban className="mr-1 h-3 w-3" />
            调整批次分组
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!hasSelected} onClick={handleBatchExport}>
            <Download className="mr-1 h-3 w-3" />
            导出
          </Button>
        </div>
      </div>

      {/* 新建/编辑弹窗 */}
      <ExamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        exam={editingExam}
        onSubmit={handleFormSubmit}
      />

      {/* 邀请共建弹窗 */}
      <InviteCollaboratorDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title={`邀请共建「${invitingExam?.name || ''}」`}
        description="邀请其他用户一起维护此试卷"
        onInvite={handleInviteSubmit}
      />

      {/* 批量导出弹窗 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>批量导出试卷</DialogTitle>
            <DialogDescription>已选择 {selectedIds.length} 个试卷，请选择导出格式</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="h-10 w-10 rounded bg-green-50 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">XLSX</span>
              </div>
              <div>
                <p className="text-sm font-medium">导出为 Excel</p>
                <p className="text-xs text-slate-400">包含试卷基础信息和题目配置</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">JSON</span>
              </div>
              <div>
                <p className="text-sm font-medium">导出为 JSON</p>
                <p className="text-xs text-slate-400">完整的试卷数据结构，适用于备份和迁移</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>取消</Button>
            <Button onClick={() => setIsExportDialogOpen(false)}>确认导出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 调整批次分组弹窗 */}
      <Dialog open={isBatchMoveDialogOpen} onOpenChange={setIsBatchMoveDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>调整批次分组</DialogTitle>
            <DialogDescription>将已选择的 {selectedIds.length} 个试卷移动到其他批次分组</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="targetBatch">目标批次分组</Label>
              <Select value={batchMoveTarget} onValueChange={setBatchMoveTarget}>
                <SelectTrigger id="targetBatch">
                  <SelectValue placeholder="请选择目标批次分组" />
                </SelectTrigger>
                <SelectContent>
                  {mockBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      <span className="flex items-center gap-2">
                        {batch.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchMoveDialogOpen(false)}>取消</Button>
            <Button onClick={handleBatchMove} disabled={!batchMoveTarget}>确认移动</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
