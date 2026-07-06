"use client"

import { useState, useMemo } from "react"
import {
  Search,
  FileText,
  XCircle,
  RotateCcw,
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
import type { CertIssuanceRecord } from "@/lib/types"

export default function MicroCertHistoryPage() {
  const {
    certIssuanceRecords,
    revokeCert,
    certTypes,
  } = useData()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokingRecord, setRevokingRecord] = useState<CertIssuanceRecord | null>(null)
  const [revokeReason, setRevokeReason] = useState("")

  const filteredRecords = useMemo(() => {
    return certIssuanceRecords.filter((r) => {
      const matchSearch =
        !search ||
        r.studentName.includes(search) ||
        r.studentId.includes(search) ||
        r.templateTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.certNumber.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || r.status === statusFilter
      const matchType =
        typeFilter === "all" ||
        r.certTypeName === certTypes.find((t) => t.id === typeFilter)?.name
      return matchSearch && matchStatus && matchType
    })
  }, [certIssuanceRecords, search, statusFilter, typeFilter, certTypes])

  const stats = useMemo(() => {
    const issued = certIssuanceRecords.filter((r) => r.status === "issued").length
    const revoked = certIssuanceRecords.filter((r) => r.status === "revoked").length
    return [
      {
        label: "颁发总数",
        value: certIssuanceRecords.length,
        icon: <FileText className="size-3.5 text-blue-600" />,
        iconClassName: "bg-blue-50",
      },
      {
        label: "已颁发",
        value: issued,
        icon: <FileText className="size-3.5 text-green-600" />,
        iconClassName: "bg-green-50",
      },
      {
        label: "已撤销",
        value: revoked,
        icon: <XCircle className="size-3.5 text-red-600" />,
        iconClassName: "bg-red-50",
      },
    ]
  }, [certIssuanceRecords])

  const openRevoke = (record: CertIssuanceRecord) => {
    setRevokingRecord(record)
    setRevokeReason("")
    setRevokeOpen(true)
  }

  const handleRevoke = () => {
    if (revokingRecord && revokeReason.trim()) {
      revokeCert(revokingRecord.id, revokeReason.trim())
      setRevokeOpen(false)
      setRevokingRecord(null)
    }
  }

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="颁发历史记录"
        description="查看所有证书颁发记录，支持撤销已颁发的证书"
        stats={stats}
      />

      {/* Search & Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="搜索学生/模板/证书编号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="issued">已颁发</SelectItem>
              <SelectItem value="revoked">已撤销</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
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

      {/* History Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">证书编号</TableHead>
              <TableHead>证书标题</TableHead>
              <TableHead className="w-[100px]">认证类型</TableHead>
              <TableHead className="w-[80px]">学生</TableHead>
              <TableHead className="w-[100px]">学号</TableHead>
              <TableHead className="w-[120px]">班级</TableHead>
              <TableHead className="w-[110px]">颁发日期</TableHead>
              <TableHead className="w-[110px]">有效期</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-slate-400 py-12">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {r.certNumber}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {r.templateTitle}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 whitespace-nowrap">
                      {r.certTypeName}
                    </span>
                  </TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{r.studentId}</TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-[120px] truncate">
                    {r.className}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {r.issueDate.toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {r.expireDate ? r.expireDate.toLocaleDateString("zh-CN") : "永久有效"}
                  </TableCell>
                  <TableCell>
                    {r.status === "issued" ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-600">
                        已颁发
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600">
                        已撤销
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === "issued" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 h-7 text-xs"
                        onClick={() => openRevoke(r)}
                      >
                        <RotateCcw className="mr-1 size-3" />
                        撤销
                      </Button>
                    ) : (
                      <div className="text-xs text-slate-400">
                        {r.revokeReason
                          ? r.revokeReason.length > 6
                            ? r.revokeReason.slice(0, 6) + "..."
                            : r.revokeReason
                          : "-"}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Dialog */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>撤销证书</DialogTitle>
            <DialogDescription>
              确定要撤销 {revokingRecord?.studentName} 的证书吗？请填写撤销原因。
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>证书编号</FieldLabel>
              <p className="text-sm text-slate-700">{revokingRecord?.certNumber}</p>
            </Field>
            <Field>
              <FieldLabel>撤销原因</FieldLabel>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="请输入撤销原因"
                rows={3}
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={!revokeReason.trim()}>
              确认撤销
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
