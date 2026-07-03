"use client"

import { useState, useMemo } from "react"
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  BookOpen,
  GraduationCap,
  Laptop,
  ClipboardCheck,
  Send,
  Ban,
  Eye,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useData } from "@/components/providers/data-provider"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { APPROVAL_TYPE_LABELS, APPROVAL_STATUS_LABELS } from "@/lib/types"
import type { ApprovalType, ApprovalItem, ApprovalStatus } from "@/lib/types"
import { PrdAnnotation } from "@/components/prd-annotation"
import { getAnnotation } from "@/lib/prd-annotations"

const typeTabs: { value: ApprovalType; label: string }[] = [
  { value: "questionBank", label: "题库" },
  { value: "exam", label: "试卷" },
  { value: "onlineExam", label: "考试" },
]

const typeIcons: Record<ApprovalType, React.ReactNode> = {
  question: <FileText className="size-4" />,
  questionBank: <BookOpen className="size-4" />,
  exam: <GraduationCap className="size-4" />,
  onlineExam: <Laptop className="size-4" />,
}

export default function ApprovalCenterPage() {
  const { approvalItems, approveItem, rejectItem } = useData()

  const [search, setSearch] = useState("")
  const [typeTab, setTypeTab] = useState<ApprovalType>("questionBank")
  const [statusTab, setStatusTab] = useState<ApprovalStatus | "all">("all")
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; item: ApprovalItem | null }>({
    open: false,
    item: null,
  })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; item: ApprovalItem | null }>({
    open: false,
    item: null,
  })
  const [remark, setRemark] = useState("")
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; item: ApprovalItem | null }>({
    open: false,
    item: null,
  })

  const filteredItems = useMemo(() => {
    let list = [...approvalItems]
    list = list.filter((item) => item.type === typeTab)
    if (statusTab !== "all") {
      list = list.filter((item) => item.status === statusTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.submitterName.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => b.submitTime.getTime() - a.submitTime.getTime())
  }, [approvalItems, typeTab, statusTab, search])

  const stats = useMemo(() => {
    const total = approvalItems.length
    const pending = approvalItems.filter((i) => i.status === "pending").length
    const approved = approvalItems.filter((i) => i.status === "approved").length
    const rejected = approvalItems.filter((i) => i.status === "rejected").length
    return { total, pending, approved, rejected }
  }, [approvalItems])

  const handleApprove = () => {
    if (approveDialog.item) {
      approveItem(approveDialog.item.id, remark || undefined)
      setApproveDialog({ open: false, item: null })
      setRemark("")
    }
  }

  const handleReject = () => {
    if (rejectDialog.item) {
      rejectItem(rejectDialog.item.id, remark || undefined)
      setRejectDialog({ open: false, item: null })
      setRemark("")
    }
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {APPROVAL_STATUS_LABELS[status]}
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-emerald-500">
            <CheckCircle2 className="size-3" />
            {APPROVAL_STATUS_LABELS[status]}
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            {APPROVAL_STATUS_LABELS[status]}
          </Badge>
        )
    }
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

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="审批中心"
        description="统一审批题目、题库、试卷、在线考试的提交申请"
        stats={[
          {
            label: "审批总数",
            value: stats.total,
            icon: <ClipboardCheck className="size-4 text-blue-500" />,
            iconClassName: "bg-blue-50",
          },
          {
            label: "待审批",
            value: stats.pending,
            icon: <Clock className="size-4 text-yellow-500" />,
            iconClassName: "bg-yellow-50",
          },
          {
            label: "已通过",
            value: stats.approved,
            icon: <CheckCircle2 className="size-4 text-green-500" />,
            iconClassName: "bg-green-50",
          },
          {
            label: "已驳回",
            value: stats.rejected,
            icon: <XCircle className="size-4 text-red-500" />,
            iconClassName: "bg-red-50",
          },
        ]}
        className="mb-4"
      />

      {/* Tab 切换 */}
      <div className="mb-4">
        <Tabs value={typeTab} onValueChange={(v) => setTypeTab(v as ApprovalType)}>
          <TabsList>
            {typeTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索标题、提交人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusTab} onValueChange={(v) => setStatusTab(v as ApprovalStatus | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待审批</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="rejected">已驳回</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* 审批列表 */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {typeTab === 'questionBank' && (
                <TableRow>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-type")}>审批类型</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-title")}>题库名称</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-desc")}>题库描述</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-submitter")}>提交人</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-submit-time")}>提交时间</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-status")}>状态</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-remark")}>备注</PrdAnnotation></TableHead>
                  <TableHead className="sticky right-0 w-[160px] bg-white text-right"><PrdAnnotation data={getAnnotation("ac-col-actions")}>操作</PrdAnnotation></TableHead>
                </TableRow>
              )}
              {typeTab === 'exam' && (
                <TableRow>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-type")}>审批类型</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-title")}>试卷名称</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-desc")}>试卷描述</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-submitter")}>提交人</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-submit-time")}>提交时间</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-status")}>状态</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-remark")}>备注</PrdAnnotation></TableHead>
                  <TableHead className="sticky right-0 w-[160px] bg-white text-right"><PrdAnnotation data={getAnnotation("ac-col-actions")}>操作</PrdAnnotation></TableHead>
                </TableRow>
              )}
              {typeTab === 'onlineExam' && (
                <TableRow>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-type")}>审批类型</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-title")}>考试名称</PrdAnnotation></TableHead>
                  <TableHead className="w-[200px]"><PrdAnnotation data={getAnnotation("ac-col-desc")}>考试描述</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-submitter")}>提交人</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-submit-time")}>提交时间</PrdAnnotation></TableHead>
                  <TableHead className="w-[100px]"><PrdAnnotation data={getAnnotation("ac-col-status")}>状态</PrdAnnotation></TableHead>
                  <TableHead className="w-[150px]"><PrdAnnotation data={getAnnotation("ac-col-remark")}>备注</PrdAnnotation></TableHead>
                  <TableHead className="sticky right-0 w-[160px] bg-white text-right"><PrdAnnotation data={getAnnotation("ac-col-actions")}>操作</PrdAnnotation></TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    暂无审批记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[item.type]}
                        <span className="text-sm">{APPROVAL_TYPE_LABELS[item.type]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {item.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.submitterName}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.submitTime)}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.remark || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white text-right relative">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm z-10 px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600"
                          onClick={() => setDetailDialog({ open: true, item })}
                        >
                          <PrdAnnotation data={getAnnotation("ac-col-actions")}>
                            <Eye className="size-3" />
                            查看详情
                          </PrdAnnotation>
                        </Button>
                        {item.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-600"
                              onClick={() => {
                                setApproveDialog({ open: true, item })
                                setRemark("")
                              }}
                            >
                              <PrdAnnotation data={getAnnotation("ac-btn-approve")}>
                                <CheckCircle2 className="mr-1 size-3.5" />
                                同意
                              </PrdAnnotation>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                              onClick={() => {
                                setRejectDialog({ open: true, item })
                                setRemark("")
                              }}
                            >
                              <PrdAnnotation data={getAnnotation("ac-btn-reject")}>
                                <Ban className="mr-1 size-3.5" />
                                驳回
                              </PrdAnnotation>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 同意弹窗 */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog({ open: false, item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>审批通过</DialogTitle>
            <DialogDescription>
              确认通过「{approveDialog.item?.title}」的审批申请？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">审批备注（非必填）</label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入审批备注..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, item: null })}>
              取消
            </Button>
            <Button onClick={handleApprove}>
              <Send className="mr-2 size-4" />
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>审批驳回</DialogTitle>
            <DialogDescription>
              确认驳回「{rejectDialog.item?.title}」的审批申请？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">驳回备注（非必填）</label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入驳回原因..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, item: null })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <Ban className="mr-2 size-4" />
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看详情弹窗 */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, item: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>审批详情</DialogTitle>
            <DialogDescription>
              {detailDialog.item?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">审批类型</span>
              <span>{detailDialog.item ? APPROVAL_TYPE_LABELS[detailDialog.item.type] : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">标题</span>
              <span>{detailDialog.item?.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">描述</span>
              <span className="max-w-xs text-right">{detailDialog.item?.description || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">提交人</span>
              <span>{detailDialog.item?.submitterName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">提交时间</span>
              <span>{detailDialog.item ? formatDate(detailDialog.item.submitTime) : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">状态</span>
              <span>{detailDialog.item ? getStatusBadge(detailDialog.item.status) : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">备注</span>
              <span className="max-w-xs text-right">{detailDialog.item?.remark || '-'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
