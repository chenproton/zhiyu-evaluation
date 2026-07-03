"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  FileText,
  Settings,
  FolderTree,
  Upload,
  List,
  LayoutGrid,
  RotateCcw,
  GitBranch,
  ArrowUpFromLine,
  CheckCircle2,
  Send,
  Undo2,
  ArrowDownFromLine,
  Copy,
  Trash2,
  Download,
  FolderKanban,
} from "lucide-react"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { BankFormDialog } from "@/components/question-banks/bank-form-dialog"
import { BankStatusActions } from "@/components/question-banks/bank-status-actions"
import { InviteCollaboratorDialog } from "@/components/shared/invite-collaborator-dialog"
import { useData } from "@/components/providers/data-provider"
import type { QuestionBank, QuestionBankFormData } from "@/lib/types"
import { mockUsers, mockBatches } from "@/lib/mock-data"
import { PrdAnnotation } from "@/components/prd-annotation"
import { getAnnotation } from "@/lib/prd-annotations"
import { cn } from "@/lib/utils"

type OwnerTab = 'mine' | 'collaborate' | 'public'
type ViewMode = 'list' | 'batch'

export default function QuestionBanksPage() {
  const router = useRouter()
  const {
    questionBanks,
    questions,
    createQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    updateQuestionBankStatus,
    getQuestionsByBank,
    createQuestion,
  } = useData()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null)
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('mine')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invitingBank, setInvitingBank] = useState<QuestionBank | null>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState(false)
  const [batchMoveTarget, setBatchMoveTarget] = useState<string>("")

  const filteredBanks = useMemo(() => {
    return questionBanks
      .filter((bank) => {
        const q = search.toLowerCase().trim()
        const matchSearch = !q || bank.name.toLowerCase().includes(q)
        const matchOwner = bank.ownerType === ownerTab
        const matchStatus = statusFilter === "all" || bank.status === statusFilter
        return matchSearch && matchOwner && matchStatus
      })
      .sort((a, b) => {
        // 草稿库始终置顶
        if (a.isDraftPool && !b.isDraftPool) return -1
        if (!a.isDraftPool && b.isDraftPool) return 1
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
  }, [questionBanks, search, statusFilter, ownerTab])

  const stats = useMemo(() => {
    const total = questionBanks.length
    const draft = questionBanks.filter((b) => b.status === 'draft').length
    const pending = questionBanks.filter((b) => b.status === 'pending').length
    const toPublish = questionBanks.filter((b) => b.status === 'toPublish').length
    const published = questionBanks.filter((b) => b.status === 'published').length
    return { total, draft, pending, toPublish, published }
  }, [questionBanks])

  const handleFormSubmit = (data: QuestionBankFormData) => {
    if (editingBank) {
      updateQuestionBank(editingBank.id, data)
    } else {
      const newBank = createQuestionBank(data)
      router.push(`/question-banks/${newBank.id}`)
    }
    setEditingBank(null)
  }

  const handleEdit = (bank: QuestionBank) => {
    setEditingBank(bank)
    setFormOpen(true)
  }

  const handleInvite = (bank: QuestionBank) => {
    setInvitingBank(bank)
    setInviteOpen(true)
  }

  const handleInviteSubmit = (users: { userId: string; role: 'editor' | 'viewer' }[]) => {
    console.log('邀请用户:', users, '到题库:', invitingBank?.name)
    setInvitingBank(null)
  }

  const handleCloneBank = (bank: QuestionBank) => {
    const newBank = createQuestionBank({
      name: `${bank.name}（克隆）`,
      description: bank.description,
      coverUrl: bank.coverUrl,
      batchId: bank.batchId,
      collaboratorIds: [],
      collaboratorDeptIds: [],
    })

    const bankQuestions = getQuestionsByBank(bank.id)
    bankQuestions.forEach((q) => {
      createQuestion(newBank.id, {
        type: q.type,
        content: q.content,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
        score: q.score,
        difficulty: q.difficulty,
        knowledgePoints: q.knowledgePoints,
      })
    })
  }

  const handleDelete = (bank: QuestionBank) => {
    if (bank.isDraftPool) {
      alert('默认题库不可删除')
      return
    }
    if (confirm(`确定要删除题库「${bank.name}」吗？题库中的所有题目也会被删除。`)) {
      deleteQuestionBank(bank.id)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const getBatchName = (bank: QuestionBank) => {
    return mockBatches.find(b => b.id === bank.batchId)?.name || '-'
  }

  const selectableBanks = useMemo(() => filteredBanks.filter((b) => !b.isDraftPool), [filteredBanks])

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((sid) => sid !== id)))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectableBanks.map((b) => b.id))
    } else {
      setSelectedIds([])
    }
  }

  const selectedBanks = questionBanks.filter((b) => selectedIds.includes(b.id))
  const hasSelected = selectedIds.length > 0

  const canBatchSubmit = selectedBanks.some((b) => b.status === "draft" || b.status === "rejected" || b.status === "unsubmitted")
  const canBatchWithdraw = selectedBanks.some((b) => b.status === "pending")
  const canBatchPublish = selectedBanks.some((b) => b.status === "toPublish")
  const canBatchUnpublish = selectedBanks.some((b) => b.status === "published")
  const canBatchDelete = selectedBanks.some((b) => b.status === "draft" || b.status === "rejected" || b.status === "unsubmitted")

  const handleBatchSubmitApproval = () => {
    selectedIds.forEach((id) => updateQuestionBankStatus(id, "submit"))
    setSelectedIds([])
  }

  const handleBatchWithdrawApproval = () => {
    selectedIds.forEach((id) => updateQuestionBankStatus(id, "withdraw"))
    setSelectedIds([])
  }

  const handleBatchPublish = () => {
    selectedIds.forEach((id) => updateQuestionBankStatus(id, "publish"))
    setSelectedIds([])
  }

  const handleBatchUnpublish = () => {
    selectedIds.forEach((id) => updateQuestionBankStatus(id, "unpublish"))
    setSelectedIds([])
  }

  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个题库吗？`)) {
      selectedIds.forEach((id) => deleteQuestionBank(id))
      setSelectedIds([])
    }
  }

  const handleBatchClone = () => {
    selectedBanks.forEach((bank) => handleCloneBank(bank))
    setSelectedIds([])
  }

  const handleBatchMove = () => {
    if (!batchMoveTarget) return
    selectedIds.forEach((id) => {
      const bank = questionBanks.find((b) => b.id === id)
      if (bank) {
        updateQuestionBank(id, { name: bank.name, description: bank.description, batchId: batchMoveTarget })
      }
    })
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
        title="题库管理"
        description="管理所有题库，点击进入题目列表进行管理"
        actions={
          <>
            <PrdAnnotation data={getAnnotation("qb-btn-config-approval")}>
              <Button variant="outline">
                <Settings className="mr-2 size-4" />
                配置审批流程
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("qb-btn-config-batch")}>
              <Button variant="outline">
                <FolderTree className="mr-2 size-4" />
                配置批次分组
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("qb-btn-import")}>
              <Button variant="outline">
                <Upload className="mr-2 size-4" />
                导入题库
              </Button>
            </PrdAnnotation>
            <PrdAnnotation data={getAnnotation("qb-btn-create")}>
              <Button onClick={() => { setEditingBank(null); setFormOpen(true) }}>
                <Plus className="mr-2 size-4" />
                新建题库
              </Button>
            </PrdAnnotation>
          </>
        }
        stats={[
          {
            label: "题库总数",
            value: stats.total,
            icon: <FileText className="size-3.5 text-blue-500" />,
            iconClassName: "bg-blue-50",
          },
          {
            label: "草稿",
            value: stats.draft,
            icon: <RotateCcw className="size-3.5 text-gray-500" />,
            iconClassName: "bg-gray-50",
          },
          {
            label: "审批中",
            value: stats.pending,
            icon: <GitBranch className="size-3.5 text-yellow-500" />,
            iconClassName: "bg-yellow-50",
          },
          {
            label: "待发布",
            value: stats.toPublish,
            icon: <ArrowUpFromLine className="size-3.5 text-amber-500" />,
            iconClassName: "bg-amber-50",
          },
          {
            label: "已发布",
            value: stats.published,
            icon: <CheckCircle2 className="size-3.5 text-green-500" />,
            iconClassName: "bg-green-50",
          },
        ]}
        className="mb-4"
      />

      {/* Tab 切换与视图切换 */}
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={ownerTab} onValueChange={(v) => setOwnerTab(v as OwnerTab)}>
          <TabsList>
            <TabsTrigger value="mine">我的题库</TabsTrigger>
            <TabsTrigger value="collaborate">共建题库</TabsTrigger>
            <TabsTrigger value="public">公共题库</TabsTrigger>
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
            placeholder="搜索题库名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* 题库列表 */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={selectableBanks.length > 0 && selectableBanks.every((b) => selectedIds.includes(b.id)) ? true : selectedBanks.some((b) => selectableBanks.map((sb) => sb.id).includes(b.id)) ? "indeterminate" : false}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    aria-label="全选"
                  />
                </TableHead>
                <TableHead className="w-[200px]">
                  <PrdAnnotation data={getAnnotation("qb-col-name")}>题库名称</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[200px]">
                  <PrdAnnotation data={getAnnotation("qb-col-desc")}>题库简介</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("qb-col-count")}>题目数量</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[120px]">
                  <PrdAnnotation data={getAnnotation("qb-col-batch")}>所属批次</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("qb-col-creator")}>创建人</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("qb-col-collaborators")}>共建人</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("qb-col-status")}>状态</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[120px]">创建时间</TableHead>
                <TableHead className="w-[120px]">更新时间</TableHead>
                <TableHead className="sticky right-0 w-[80px] bg-white text-right">
                  <PrdAnnotation data={getAnnotation("qb-col-actions")}>操作</PrdAnnotation>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    暂无题库记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanks.map((bank) => {
                  const isSelected = selectedIds.includes(bank.id)
                  return (
                    <TableRow
                      key={bank.id}
                      className={cn("group cursor-pointer hover:bg-muted/50", isSelected && "bg-primary/5")}
                      onClick={() => router.push(`/question-banks/${bank.id}`)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {!bank.isDraftPool && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectId(bank.id, checked === true)}
                            aria-label={`选择 ${bank.name}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {bank.isDraftPool && (
                            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              草稿库
                            </span>
                          )}
                          <span className="text-sm font-medium">{bank.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-2">{bank.description || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{bank.questionCount} 题</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getBatchName(bank)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">张三</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{bank.isDraftPool ? '-' : (bank.collaboratorIds?.length ? bank.collaboratorIds.map(id => mockUsers.find(u => u.id === id)?.name).filter(Boolean).join('、') || '-' : '-')}</span>
                      </TableCell>
                      <TableCell>
                        {bank.isDraftPool ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                          <StatusBadge status={bank.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatDate(bank.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatDate(bank.updatedAt)}</span>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white text-right relative">
                        <BankStatusActions
                          status={bank.status}
                          onView={() => router.push(`/question-banks/${bank.id}`)}
                          onEdit={bank.isDraftPool ? undefined : () => handleEdit(bank)}
                          onDelete={bank.isDraftPool ? undefined : () => handleDelete(bank)}
                          onStatusChange={bank.isDraftPool ? undefined : (action) => updateQuestionBankStatus(bank.id, action)}
                          onInvite={bank.isDraftPool ? undefined : () => handleInvite(bank)}
                          onClone={bank.isDraftPool ? undefined : () => handleCloneBank(bank)}
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
            {hasSelected ? `已选择 ${selectedIds.length} 项：` : "请选择题库："}
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
      <BankFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bank={editingBank}
        onSubmit={handleFormSubmit}
      />

      {/* 邀请共建弹窗 */}
      <InviteCollaboratorDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title={`邀请共建「${invitingBank?.name || ''}」`}
        description="邀请其他用户一起维护此题库"
        onInvite={handleInviteSubmit}
      />

      {/* 批量导出弹窗 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>批量导出题库</DialogTitle>
            <DialogDescription>已选择 {selectedIds.length} 个题库，请选择导出格式</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="h-10 w-10 rounded bg-green-50 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">XLSX</span>
              </div>
              <div>
                <p className="text-sm font-medium">导出为 Excel</p>
                <p className="text-xs text-slate-400">包含题库基础信息和题目配置</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">JSON</span>
              </div>
              <div>
                <p className="text-sm font-medium">导出为 JSON</p>
                <p className="text-xs text-slate-400">完整的题库数据结构，适用于备份和迁移</p>
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
            <DialogDescription>将已选择的 {selectedIds.length} 个题库移动到其他批次分组</DialogDescription>
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
