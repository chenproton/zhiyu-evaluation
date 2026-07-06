"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Send,
  Upload,
  Download,
  Check,
  X,
  FileSpreadsheet,
  Users,
  ChevronDown,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { useData } from "@/components/providers/data-provider"
import { mockStudents } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "templates", label: "微证书模板管理", href: "/micro-certificates/templates" },
  { id: "issuance", label: "证书颁发", href: "/micro-certificates/issuance" },
  { id: "history", label: "颁发历史记录", href: "/micro-certificates/history" },
]

type IssueMode = "manual" | "batch"

interface BatchRow {
  studentName: string
  studentId: string
  className: string
}

export default function MicroCertIssuancePage() {
  const router = useRouter()
  const {
    microCertTemplates,
    certIssuanceRecords,
    issueCert,
    issueBatchCerts,
  } = useData()

  const [mode, setMode] = useState<IssueMode>("manual")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [expireDate, setExpireDate] = useState("")

  // Manual issuance
  const [studentSearch, setStudentSearch] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [manualIssuing, setManualIssuing] = useState(false)

  // Batch issuance
  const [batchRows, setBatchRows] = useState<BatchRow[]>([])
  const [batchIssuing, setBatchIssuing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Success dialog
  const [successOpen, setSuccessOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const selectedTemplate = useMemo(
    () => microCertTemplates.find((t) => t.id === selectedTemplateId) || null,
    [microCertTemplates, selectedTemplateId]
  )

  const filteredStudents = useMemo(() => {
    return mockStudents.filter((s) => {
      const match = !studentSearch ||
        s.name.includes(studentSearch) ||
        s.id.includes(studentSearch) ||
        s.className.includes(studentSearch)
      const alreadyIssued = certIssuanceRecords.some(
        (r) => r.templateId === selectedTemplateId && r.studentId === s.id && r.status === "issued"
      )
      return match && !alreadyIssued
    })
  }, [mockStudents, studentSearch, selectedTemplateId, certIssuanceRecords])

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedStudentIds(next)
  }

  const toggleAllFiltered = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const handleManualIssue = () => {
    if (!selectedTemplateId || selectedStudentIds.size === 0) return
    setManualIssuing(true)

    const records = Array.from(selectedStudentIds).map((studentId) => {
      const student = mockStudents.find((s) => s.id === studentId)!
      return {
        templateId: selectedTemplateId,
        templateTitle: selectedTemplate!.title,
        certTypeName: selectedTemplate!.certTypeName,
        studentName: student.name,
        studentId: student.id,
        className: student.className,
        issueDate: new Date(),
        expireDate: expireDate ? new Date(expireDate) : undefined,
      }
    })

    issueBatchCerts(records)
    setSelectedStudentIds(new Set())
    setManualIssuing(false)
    setSuccessMessage(`成功颁发 ${records.length} 份证书`)
    setSuccessOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split("\n").filter((l) => l.trim())
      const rows: BatchRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim())
        if (cols.length >= 3) {
          rows.push({
            studentName: cols[0],
            studentId: cols[1],
            className: cols[2],
          })
        }
      }

      setBatchRows(rows)
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const downloadTemplate = () => {
    const header = "姓名,学号,班级"
    const row = "张三,2021001,2021级前端开发1班"
    const csv = `${header}\n${row}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "证书批量导入模板.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBatchIssue = () => {
    if (!selectedTemplateId || batchRows.length === 0) return
    setBatchIssuing(true)

    const records = batchRows.map((row) => ({
      templateId: selectedTemplateId,
      templateTitle: selectedTemplate!.title,
      certTypeName: selectedTemplate!.certTypeName,
      studentName: row.studentName,
      studentId: row.studentId,
      className: row.className,
      issueDate: new Date(),
      expireDate: expireDate ? new Date(expireDate) : undefined,
    }))

    issueBatchCerts(records)
    setBatchRows([])
    setBatchIssuing(false)
    setSuccessMessage(`成功批量颁发 ${records.length} 份证书`)
    setSuccessOpen(true)
  }

  const stats = [
    {
      label: "可用模板",
      value: microCertTemplates.length,
      icon: <FileSpreadsheet className="size-3.5 text-blue-600" />,
      iconClassName: "bg-blue-50",
    },
    {
      label: "已颁发",
      value: certIssuanceRecords.filter((r) => r.status === "issued").length,
      icon: <Check className="size-3.5 text-green-600" />,
      iconClassName: "bg-green-50",
    },
  ]

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="证书颁发"
        description="选择模板后，支持手动选择学生或批量导入名单进行证书颁发"
        stats={stats}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 mt-4 mb-4 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab.id === "issuance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Template Selection */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">选择模板：</span>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="请选择微证书模板" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {microCertTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">有效期至：</span>
            <Input
              type="date"
              value={expireDate}
              onChange={(e) => setExpireDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("manual")}
            >
              <Users className="mr-1 size-3.5" />
              手动颁发
            </Button>
            <Button
              variant={mode === "batch" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("batch")}
            >
              <Upload className="mr-1 size-3.5" />
              批量颁发
            </Button>
          </div>
        </div>

        {selectedTemplate && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              已选模板：<span className="font-medium text-slate-700">{selectedTemplate.title}</span>
              <span className="mx-2">|</span>
              类型：<span className="font-medium text-slate-700">{selectedTemplate.certTypeName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Manual Issuance Mode */}
      {mode === "manual" && (
        <div>
          <div className="flex gap-4 mb-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="搜索学生姓名/学号/班级..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-slate-500">
              已选 {selectedStudentIds.size} 人
            </span>
            {selectedTemplateId && selectedStudentIds.size > 0 && (
              <Button size="sm" onClick={handleManualIssue} disabled={manualIssuing}>
                <Send className="mr-1 size-3.5" />
                {manualIssuing ? "颁发中..." : `颁发证书 (${selectedStudentIds.size})`}
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredStudents.length > 0 &&
                        selectedStudentIds.size === filteredStudents.length
                      }
                      onCheckedChange={toggleAllFiltered}
                    />
                  </TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead className="w-[120px]">颁发状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-12">
                      {selectedTemplateId
                        ? "暂无可颁发的学生（可能已全部颁发）"
                        : "请先选择模板"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.has(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-slate-500">{student.id}</TableCell>
                      <TableCell className="text-slate-500">{student.className}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">
                          未颁发
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Batch Issuance Mode */}
      {mode === "batch" && (
        <div>
          <div className="flex gap-4 mb-4 items-center flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 size-4" />
              上传名单文件 (CSV)
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="mr-1.5 size-3.5" />
              下载导入模板
            </Button>
            {batchRows.length > 0 && selectedTemplateId && (
              <Button onClick={handleBatchIssue} disabled={batchIssuing}>
                <Send className="mr-1 size-3.5" />
                {batchIssuing ? "颁发中..." : `批量颁发 (${batchRows.length})`}
              </Button>
            )}
          </div>

          {batchRows.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">序号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>学号</TableHead>
                    <TableHead>班级</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell className="text-slate-500">{row.studentId}</TableCell>
                      <TableCell className="text-slate-500">{row.className}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {batchRows.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
              <FileSpreadsheet className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">请上传 CSV 格式的学生名单文件</p>
              <p className="text-xs text-slate-400 mt-1">
                文件格式：姓名,学号,班级 （第一行为标题行）
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>颁发成功</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
