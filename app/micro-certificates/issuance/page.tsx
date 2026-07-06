"use client"

import { useState, useMemo, useRef } from "react"
import {
  Search,
  Send,
  Upload,
  Download,
  Check,
  Users,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { useData } from "@/components/providers/data-provider"
import { mockStudents } from "@/lib/mock-data"

type IssueMode = "manual" | "batch" | null

export default function MicroCertIssuancePage() {
  const {
    microCertTemplates,
    certIssuanceRecords,
    issueBatchCerts,
  } = useData()

  const [expireDate, setExpireDate] = useState("")
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set())
  const [issueMode, setIssueMode] = useState<IssueMode>(null)

  const [studentSearch, setStudentSearch] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  const [batchRows, setBatchRows] = useState<{ studentName: string; studentId: string; className: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [successOpen, setSuccessOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const selectedTemplates = useMemo(
    () => microCertTemplates.filter((t) => selectedTemplateIds.has(t.id)),
    [microCertTemplates, selectedTemplateIds]
  )

  const toggleTemplate = (id: string) => {
    const next = new Set(selectedTemplateIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedTemplateIds(next)
  }

  const filteredStudents = useMemo(() => {
    return mockStudents.filter((s) => {
      const match = !studentSearch ||
        s.name.includes(studentSearch) ||
        s.id.includes(studentSearch) ||
        s.className.includes(studentSearch)
      return match
    })
  }, [studentSearch])

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedStudentIds(next)
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const hasIssued = (templateId: string, studentId: string) => {
    return certIssuanceRecords.some(
      (r) => r.templateId === templateId && r.studentId === studentId && r.status === "issued"
    )
  }

  const switchMode = (mode: IssueMode) => {
    if (mode !== null && selectedTemplateIds.size === 0) {
      alert("请先选择证书模板")
      return
    }
    setIssueMode(mode)
    setStudentSearch("")
    setSelectedStudentIds(new Set())
    setBatchRows([])
  }

  const handleManualIssue = () => {
    if (selectedTemplateIds.size === 0 || selectedStudentIds.size === 0) return

    const records: Array<{
      templateId: string
      templateTitle: string
      certTypeName: string
      studentName: string
      studentId: string
      className: string
      issueDate: Date
      expireDate?: Date
    }> = []

    selectedTemplateIds.forEach((templateId) => {
      const template = microCertTemplates.find((t) => t.id === templateId)!
      selectedStudentIds.forEach((studentId) => {
        if (!hasIssued(templateId, studentId)) {
          const student = mockStudents.find((s) => s.id === studentId)!
          records.push({
            templateId,
            templateTitle: template.title,
            certTypeName: template.certTypeName,
            studentName: student.name,
            studentId: student.id,
            className: student.className,
            issueDate: new Date(),
            expireDate: expireDate ? new Date(expireDate) : undefined,
          })
        }
      })
    })

    if (records.length === 0) {
      alert("所选学生在所选模板下均已颁发")
      return
    }

    issueBatchCerts(records)
    setSelectedStudentIds(new Set())
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
      const rows: { studentName: string; studentId: string; className: string }[] = []

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim())
        if (cols.length >= 3) {
          rows.push({ studentName: cols[0], studentId: cols[1], className: cols[2] })
        }
      }
      setBatchRows(rows)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const downloadTemplate = () => {
    const csv = "姓名,学号,班级\n张三,2021001,2021级前端开发1班"
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "证书批量导入模板.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBatchIssue = () => {
    if (selectedTemplateIds.size === 0 || batchRows.length === 0) return

    const records: Array<{
      templateId: string
      templateTitle: string
      certTypeName: string
      studentName: string
      studentId: string
      className: string
      issueDate: Date
      expireDate?: Date
    }> = []

    selectedTemplateIds.forEach((templateId) => {
      const template = microCertTemplates.find((t) => t.id === templateId)!
      batchRows.forEach((row) => {
        records.push({
          templateId,
          templateTitle: template.title,
          certTypeName: template.certTypeName,
          studentName: row.studentName,
          studentId: row.studentId,
          className: row.className,
          issueDate: new Date(),
          expireDate: expireDate ? new Date(expireDate) : undefined,
        })
      })
    })

    issueBatchCerts(records)
    setBatchRows([])
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
        description="选择证书模板后，通过手动选择或批量导入进行证书颁发"
        stats={stats}
      />

      {/* Template Selection */}
      <div className="bg-white border rounded-lg p-4 my-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">选择模板：</span>
          <div className="flex flex-wrap gap-2">
            {microCertTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTemplate(t.id)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedTemplateIds.has(t.id)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {t.title}
                <span className={`ml-1.5 text-xs ${selectedTemplateIds.has(t.id) ? "text-blue-500" : "text-slate-400"}`}>
                  [{t.certTypeName}]
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">有效期至：</span>
          <Input
            type="date"
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
            className="w-44"
          />
          {selectedTemplates.length > 0 && (
            <span className="text-xs text-slate-500">
              已选 {selectedTemplates.length} 个模板
            </span>
          )}
        </div>
      </div>

      {/* Mode Buttons */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          size="sm"
          variant={issueMode === "manual" ? "default" : "outline"}
          onClick={() => switchMode("manual")}
        >
          <Users className="mr-1.5 size-4" />
          手动颁发
        </Button>
        <Button
          size="sm"
          variant={issueMode === "batch" ? "default" : "outline"}
          onClick={() => switchMode("batch")}
        >
          <Upload className="mr-1.5 size-4" />
          批量颁发
        </Button>
      </div>

      {/* Manual Issuance - Student List */}
      {issueMode === "manual" && (
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
            <span className="text-sm text-slate-500 whitespace-nowrap">
              已选 {selectedStudentIds.size} 人
            </span>
            {selectedStudentIds.size > 0 && (
              <Button size="sm" onClick={handleManualIssue}>
                <Send className="mr-1 size-3.5" />
                颁发证书 ({selectedStudentIds.size}人 × {selectedTemplateIds.size}模板 = {selectedStudentIds.size * selectedTemplateIds.size}份)
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                      onCheckedChange={toggleAllStudents}
                    />
                  </TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead className="w-[200px]">当前模板颁发状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const issuedTemplates = selectedTemplates.filter((t) => hasIssued(t.id, student.id))
                  const unissuedTemplates = selectedTemplates.filter((t) => !hasIssued(t.id, student.id))
                  return (
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
                        {selectedTemplateIds.size === 0 ? (
                          <span className="text-xs text-slate-400">未选择模板</span>
                        ) : unissuedTemplates.length === 0 ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-600">
                            已全部颁发
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                              待颁发 {unissuedTemplates.length}
                            </span>
                            {issuedTemplates.length > 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-600">
                                已颁发 {issuedTemplates.length}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Batch Issuance - Upload Card */}
      {issueMode === "batch" && (
        <div>
          {batchRows.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
              <FileSpreadsheet className="size-8 text-slate-300 mx-auto mb-3" />
              <div className="flex items-center justify-center gap-3 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 size-4" />
                  上传名单文件 (CSV)
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-1.5 size-3.5" />
                  下载导入模板
                </Button>
              </div>
              <p className="text-sm text-slate-400">
                请上传 CSV 格式的学生名单文件，第一行为标题行（姓名,学号,班级）
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 size-4" />
                  重新上传
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-1.5 size-3.5" />
                  下载导入模板
                </Button>
                <Button size="sm" onClick={handleBatchIssue} className="ml-auto">
                  <Send className="mr-1 size-3.5" />
                  确认批量颁发 ({batchRows.length}人 × {selectedTemplateIds.size}模板 = {batchRows.length * selectedTemplateIds.size}份)
                </Button>
              </div>

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
            </div>
          )}
        </div>
      )}

      {/* No mode selected tip */}
      {issueMode === null && (
        <div className="text-center py-12 border rounded-lg bg-slate-50">
          <Users className="size-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">请先选择证书模板，然后点击上方按钮选择手动或批量颁发方式</p>
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
