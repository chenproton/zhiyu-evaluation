"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus, Search, BookOpen, Video, GraduationCap, PlayCircle, X, ChevronDown, MoreHorizontal, Eye, Pencil, Trash2, Clock, CheckCircle2, XCircle, Share2, ImageIcon, Users, Undo2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useData } from "@/components/providers/data-provider"
import { PageHeaderCard } from "@/components/shared/page-header-card"
import { CoBuilderDialog } from "@/components/shared/co-builder-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { mockUsers } from "@/lib/mock-data"
import { PrdAnnotation } from "@/components/prd-annotation"
import { getAnnotation } from "@/lib/prd-annotations"

// 使用类型：随堂测、在线考试
type UsageType = 'quiz' | 'exam'

// 使用场景：场景、课程
type SceneType = 'scene' | 'course'

export interface ExamUsage {
  id: string
  examId: string
  examName: string
  displayType: '场景' | '课程' | '教学考试'
  sceneName: string
  usageType: UsageType
  description?: string
  duration?: number
  startTime?: Date
  endTime?: Date
  participantCount: number
  passCount?: number
  status: 'pending' | 'active' | 'ended'
  approvalStatus?: 'draft' | 'pending' | 'toPublish' | 'published'
  targetAudience?: 'student' | 'teacher'
  teacherIds?: string[]
}

// 模拟班级数据
export const mockClasses = [
  { id: 'class-1', name: '2024级前端开发1班' },
  { id: 'class-2', name: '2024级前端开发2班' },
  { id: 'class-3', name: '2024级后端开发1班' },
  { id: 'class-4', name: '2024级后端开发2班' },
  { id: 'class-5', name: '2024级全栈开发班' },
  { id: 'class-6', name: '2024级测试工程班' },
  { id: 'class-7', name: '2024级产品设计班' },
  { id: 'class-8', name: '2023级前端开发1班' },
]

export interface OrgNode {
  id: string
  name: string
  type: 'department' | 'grade' | 'class' | 'student'
  children?: OrgNode[]
}

export const mockOrgClasses: OrgNode[] = [
  {
    id: 'dept-1',
    name: '计算机学院',
    type: 'department',
    children: [
      {
        id: 'grade-1-1',
        name: '2024级',
        type: 'grade',
        children: [
          {
            id: 'class-1',
            name: '2024级前端开发1班',
            type: 'class',
            children: [
              { id: 'stu-1-1', name: '张伟', type: 'student' },
              { id: 'stu-1-2', name: '李娜', type: 'student' },
              { id: 'stu-1-3', name: '王强', type: 'student' },
            ]
          },
          {
            id: 'class-2',
            name: '2024级前端开发2班',
            type: 'class',
            children: [
              { id: 'stu-2-1', name: '刘洋', type: 'student' },
              { id: 'stu-2-2', name: '陈静', type: 'student' },
              { id: 'stu-2-3', name: '杨帆', type: 'student' },
            ]
          },
          {
            id: 'class-3',
            name: '2024级后端开发1班',
            type: 'class',
            children: [
              { id: 'stu-3-1', name: '赵敏', type: 'student' },
              { id: 'stu-3-2', name: '孙磊', type: 'student' },
              { id: 'stu-3-3', name: '周涛', type: 'student' },
            ]
          },
        ]
      },
      {
        id: 'grade-1-2',
        name: '2023级',
        type: 'grade',
        children: [
          {
            id: 'class-8',
            name: '2023级前端开发1班',
            type: 'class',
            children: [
              { id: 'stu-8-1', name: '吴倩', type: 'student' },
              { id: 'stu-8-2', name: '郑宇', type: 'student' },
            ]
          },
        ]
      }
    ]
  },
  {
    id: 'dept-2',
    name: '软件工程学院',
    type: 'department',
    children: [
      {
        id: 'grade-2-1',
        name: '2024级',
        type: 'grade',
        children: [
          {
            id: 'class-4',
            name: '2024级后端开发2班',
            type: 'class',
            children: [
              { id: 'stu-4-1', name: '马超', type: 'student' },
              { id: 'stu-4-2', name: '朱琳', type: 'student' },
              { id: 'stu-4-3', name: '胡军', type: 'student' },
            ]
          },
          {
            id: 'class-5',
            name: '2024级全栈开发班',
            type: 'class',
            children: [
              { id: 'stu-5-1', name: '郭明', type: 'student' },
              { id: 'stu-5-2', name: '何秀', type: 'student' },
              { id: 'stu-5-3', name: '高飞', type: 'student' },
            ]
          },
          {
            id: 'class-6',
            name: '2024级测试工程班',
            type: 'class',
            children: [
              { id: 'stu-6-1', name: '林峰', type: 'student' },
              { id: 'stu-6-2', name: '罗丹', type: 'student' },
              { id: 'stu-6-3', name: '梁雪', type: 'student' },
            ]
          },
        ]
      },
      {
        id: 'grade-2-2',
        name: '2023级',
        type: 'grade',
        children: [
          {
            id: 'class-7',
            name: '2023级产品设计班',
            type: 'class',
            children: [
              { id: 'stu-7-1', name: '宋佳', type: 'student' },
              { id: 'stu-7-2', name: '唐勇', type: 'student' },
            ]
          },
        ]
      }
    ]
  }
]

// 模拟使用记录数据
export const mockUsages: ExamUsage[] = [
  {
    id: 'usage-1',
    examId: 'exam-1',
    examName: '前端基础测试',
    displayType: '课程',
    sceneName: 'JavaScript入门到精通',
    usageType: 'quiz',
    description: 'JavaScript基础语法与API测试',
    duration: 60,
    startTime: new Date('2024-03-10 14:00'),
    endTime: new Date('2024-03-10 15:00'),
    participantCount: 156,
    passCount: 128,
    status: 'active',
  },
  {
    id: 'usage-2',
    examId: 'exam-1',
    examName: '前端基础测试',
    displayType: '场景',
    sceneName: '2024春季招聘',
    usageType: 'exam',
    description: '2024年春季校园招聘技术笔试',
    duration: 120,
    startTime: new Date('2024-03-15 09:00'),
    endTime: new Date('2024-03-15 11:00'),
    participantCount: 89,
    passCount: 67,
    status: 'ended',
  },
  {
    id: 'usage-3',
    examId: 'exam-2',
    examName: 'TypeScript 能力测试',
    displayType: '教学考试',
    sceneName: 'TypeScript高级教程',
    usageType: 'quiz',
    description: 'TypeScript类型系统与高级特性测验',
    duration: 45,
    startTime: new Date('2024-03-20 10:00'),
    endTime: new Date('2024-03-20 10:45'),
    participantCount: 42,
    passCount: 38,
    status: 'active',
    approvalStatus: 'published',
    targetAudience: 'student',
  },
  {
    id: 'usage-4',
    examId: 'exam-2',
    examName: 'TypeScript 能力测试',
    displayType: '场景',
    sceneName: '技术能力评估',
    usageType: 'exam',
    description: '季度技术能力综合评估',
    duration: 90,
    startTime: new Date('2024-04-01 14:00'),
    endTime: new Date('2024-04-01 15:30'),
    participantCount: 0,
    passCount: 0,
    status: 'pending',
  },
  {
    id: 'usage-5',
    examId: 'exam-3',
    examName: 'React 进阶考核',
    displayType: '教学考试',
    sceneName: 'React实战开发',
    usageType: 'exam',
    description: 'React Hooks与性能优化专项考核',
    duration: 120,
    startTime: new Date('2024-04-10 09:00'),
    endTime: new Date('2024-04-10 11:00'),
    participantCount: 0,
    passCount: 0,
    status: 'pending',
    approvalStatus: 'pending',
    targetAudience: 'teacher',
    teacherIds: ['user-1', 'user-2'],
  },
  {
    id: 'usage-6',
    examId: 'exam-4',
    examName: 'Node.js 后端测试',
    displayType: '课程',
    sceneName: '后端开发岗位筛选',
    usageType: 'exam',
    description: 'Node.js基础与Express框架测试',
    duration: 100,
    startTime: new Date('2024-02-28 14:00'),
    endTime: new Date('2024-02-28 15:40'),
    participantCount: 56,
    passCount: 44,
    status: 'ended',
  },
]

const USAGE_TYPE_LABELS: Record<UsageType, string> = {
  quiz: '随堂测',
  exam: '教学考试',
}

const APPROVAL_STATUS_LABELS: Record<NonNullable<ExamUsage['approvalStatus']>, string> = {
  draft: '草稿',
  pending: '审批中',
  toPublish: '待发布',
  published: '已发布',
}

const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  scene: '场景',
  course: '课程',
}

const STATUS_LABELS = {
  pending: '未开始',
  active: '进行中',
  ended: '已结束',
}

export default function ExamUsagePage() {
  const router = useRouter()
  const { exams } = useData()

  const [search, setSearch] = useState("")
  const [sceneFilter, setSceneFilter] = useState<SceneType | "all">("all")
  const [usageFilter, setUsageFilter] = useState<UsageType | "all">("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [sharingUsage, setSharingUsage] = useState<ExamUsage | null>(null)
  const [copied, setCopied] = useState(false)

  // 创建在线考试表单
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [examName, setExamName] = useState("")
  const [examDesc, setExamDesc] = useState("")
  const [examDuration, setExamDuration] = useState(60)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [examOpenType, setExamOpenType] = useState<'anytime' | 'scheduled' | 'manual'>("anytime")
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [publishToFront, setPublishToFront] = useState(true)
  const [examNotice, setExamNotice] = useState(`1. 请在规定时间内完成所有题目，超时将自动提交。\n2. 单选题每题只有一个正确答案，多选题有多个正确答案。\n3. 答题过程中请勿刷新页面或关闭浏览器。\n4. 提交后无法修改答案，请确认后再提交。\n5. 考试期间系统将自动保存答题进度。`)
  const [coverUrl, setCoverUrl] = useState("")
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false)
  const [orgSearch, setOrgSearch] = useState("")
  const [targetAudience, setTargetAudience] = useState<'student' | 'teacher'>('student')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false)
  const [examSelectOpen, setExamSelectOpen] = useState(false)

  // 使用记录状态（支持撤回审批等操作）
  const [usages, setUsages] = useState<ExamUsage[]>(mockUsages)
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false)
  const [withdrawingUsageId, setWithdrawingUsageId] = useState<string | null>(null)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [endingUsageId, setEndingUsageId] = useState<string | null>(null)

  const selectedExam = exams.find(e => e.id === selectedExamId)

  const filteredUsages = useMemo(() => {
    return usages.filter((usage) => {
      const matchSearch = 
        usage.examName.toLowerCase().includes(search.toLowerCase()) ||
        usage.sceneName.toLowerCase().includes(search.toLowerCase())
      const matchScene = sceneFilter === "all" || (sceneFilter === 'scene' && usage.displayType === '场景') || (sceneFilter === 'course' && usage.displayType === '课程')
      const matchUsage = usageFilter === "all" || usage.usageType === usageFilter
      return matchSearch && matchScene && matchUsage
    })
  }, [search, sceneFilter, usageFilter, usages])

  // 统计数据
  const stats = useMemo(() => {
    const courseCount = usages.filter((u) => u.displayType === '课程').length
    const sceneCount = usages.filter((u) => u.displayType === '场景').length
    const onlineExamCount = usages.filter((u) => u.displayType === '教学考试').length
    const pendingCount = usages.filter((u) => u.status === 'pending').length
    const activeCount = usages.filter((u) => u.status === 'active').length
    const endedCount = usages.filter((u) => u.status === 'ended').length
    return { courseCount, sceneCount, onlineExamCount, pendingCount, activeCount, endedCount }
  }, [usages])

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    )
  }

  const openCreateDialog = () => {
    setCreateDialogOpen(true)
    setPublishToFront(true)
    setExamNotice(`1. 请在规定时间内完成所有题目，超时将自动提交。\n2. 单选题每题只有一个正确答案，多选题有多个正确答案。\n3. 答题过程中请勿刷新页面或关闭浏览器。\n4. 提交后无法修改答案，请确认后再提交。\n5. 考试期间系统将自动保存答题进度。`)
  }

  const handleCreateExam = () => {
    if (!selectedExamId || !examName) return
    setCreateDialogOpen(false)
    // 重置表单
    setSelectedExamId("")
    setExamName("")
    setExamDesc("")
    setExamDuration(60)
    setSelectedClassIds([])
    setExamOpenType("anytime")
    setStartTime("")
    setEndTime("")
    setPublishToFront(false)
    setCoverUrl("")
    setOrgSearch("")
    setExamNotice(`1. 请在规定时间内完成所有题目，超时将自动提交。\n2. 单选题每题只有一个正确答案，多选题有多个正确答案。\n3. 答题过程中请勿刷新页面或关闭浏览器。\n4. 提交后无法修改答案，请确认后再提交。\n5. 考试期间系统将自动保存答题进度。`)
    setTargetAudience('student')
    setSelectedTeacherIds([])
  }

  const openShareDialog = (usage: ExamUsage) => {
    setSharingUsage(usage)
    setCopied(false)
    setShareDialogOpen(true)
  }

  const openWithdrawDialog = (usageId: string) => {
    setWithdrawingUsageId(usageId)
    setConfirmWithdrawOpen(true)
  }

  const handleWithdrawApproval = () => {
    if (!withdrawingUsageId) return
    setUsages(prev => prev.map(u =>
      u.id === withdrawingUsageId
        ? { ...u, approvalStatus: 'draft' as const }
        : u
    ))
    setConfirmWithdrawOpen(false)
    setWithdrawingUsageId(null)
  }

  const openEndDialog = (usageId: string) => {
    setEndingUsageId(usageId)
    setConfirmEndOpen(true)
  }

  const handleEndExam = () => {
    if (!endingUsageId) return
    setUsages(prev => prev.map(u =>
      u.id === endingUsageId
        ? { ...u, status: 'ended' as const }
        : u
    ))
    setConfirmEndOpen(false)
    setEndingUsageId(null)
  }

  const handleCopyLink = () => {
    if (!sharingUsage) return
    const url = `https://exam.example.com/e/${sharingUsage.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
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

  const getDisplayTypeIcon = (displayType: ExamUsage['displayType']) => {
    switch (displayType) {
      case '场景':
        return <BookOpen className="size-4" />
      case '课程':
        return <Video className="size-4" />
      case '教学考试':
        return <GraduationCap className="size-4" />
    }
  }

  const getDisplayTypeLabel = (displayType: ExamUsage['displayType']) => {
    return displayType === '教学考试' ? '考试' : displayType
  }

  const getStatusBadge = (status: ExamUsage['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-500">{STATUS_LABELS[status]}</Badge>
      case 'ended':
        return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>
    }
  }

  const isFormValid = selectedExamId && examName

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const url = URL.createObjectURL(file)
    setCoverUrl(url)
  }

  const removeCover = () => {
    setCoverUrl("")
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = ""
    }
  }

  const getDescendantIds = (node: OrgNode): string[] => {
    if (node.type === 'student') return [node.id]
    return (node.children || []).flatMap(getDescendantIds)
  }

  const isNodeFullySelected = (node: OrgNode): boolean => {
    const ids = getDescendantIds(node)
    return ids.length > 0 && ids.every(id => selectedClassIds.includes(id))
  }

  const isNodePartiallySelected = (node: OrgNode): boolean => {
    const ids = getDescendantIds(node)
    return ids.some(id => selectedClassIds.includes(id)) && !ids.every(id => selectedClassIds.includes(id))
  }

  const toggleNode = (node: OrgNode) => {
    const ids = getDescendantIds(node)
    const allSelected = ids.every(id => selectedClassIds.includes(id))
    if (allSelected) {
      setSelectedClassIds(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelectedClassIds(prev => Array.from(new Set([...prev, ...ids])))
    }
  }

  const nodeMatchesSearch = (node: OrgNode, query: string): boolean => {
    if (!query) return true
    const q = query.toLowerCase()
    if (node.name.toLowerCase().includes(q)) return true
    return (node.children || []).some(child => nodeMatchesSearch(child, q))
  }

  const renderOrgNode = (node: OrgNode, depth: number) => {
    if (!nodeMatchesSearch(node, orgSearch)) return null
    const checked = isNodeFullySelected(node)
    const indeterminate = isNodePartiallySelected(node)
    const indentClass = depth === 0 ? 'pl-2' : depth === 1 ? 'pl-6' : depth === 2 ? 'pl-10' : 'pl-14'

    return (
      <div key={node.id}>
        <label className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted ${indentClass}`}>
          <Checkbox
            checked={checked}
            data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
            onCheckedChange={() => toggleNode(node)}
          />
          <span className="text-sm">{node.name}</span>
          {node.type === 'student' && (
            <span className="text-xs text-muted-foreground">学生</span>
          )}
        </label>
        {node.children?.map(child => renderOrgNode(child, depth + 1))}
      </div>
    )
  }

  const nodeNameMap = useMemo(() => {
    const map = new Map<string, string>()
    const traverse = (node: OrgNode) => {
      map.set(node.id, node.name)
      node.children?.forEach(traverse)
    }
    mockOrgClasses.forEach(traverse)
    return map
  }, [])

  return (
    <div className="px-8 py-6">
      <PageHeaderCard
        title="考试管理"
        description="查看试卷在各模块的使用情况"
        className="mb-4"
        actions={
          <PrdAnnotation data={getAnnotation("eu-btn-create")}>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" />
              添加考试
            </Button>
          </PrdAnnotation>
        }
        stats={[
          {
            label: "考试总数",
            value: mockUsages.length,
            icon: <GraduationCap className="size-4 text-blue-500" />,
            iconClassName: "bg-blue-50",
          },
          {
            label: "未开始",
            value: stats.pendingCount,
            icon: <Clock className="size-4 text-amber-500" />,
            iconClassName: "bg-amber-50",
          },
          {
            label: "进行中",
            value: stats.activeCount,
            icon: <PlayCircle className="size-4 text-green-500" />,
            iconClassName: "bg-green-50",
          },
          {
            label: "已结束",
            value: stats.endedCount,
            icon: <CheckCircle2 className="size-4 text-gray-500" />,
            iconClassName: "bg-gray-50",
          },
        ]}
      />

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索试卷或场景名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sceneFilter} onValueChange={(v) => setSceneFilter(v as SceneType | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部场景" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部场景</SelectItem>
              <SelectItem value="scene">场景</SelectItem>
              <SelectItem value="course">课程</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={usageFilter} onValueChange={(v) => setUsageFilter(v as UsageType | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="quiz">随堂测</SelectItem>
              <SelectItem value="exam">教学考试</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* 使用记录列表 */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">
                  <PrdAnnotation data={getAnnotation("eu-col-exam-name")}>试卷名称</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[120px]">
                  <PrdAnnotation data={getAnnotation("eu-col-scene")}>使用场景</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("eu-col-target")}>面向对象</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[160px]">
                  <PrdAnnotation data={getAnnotation("eu-col-desc")}>考试描述</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[90px]">
                  <PrdAnnotation data={getAnnotation("eu-col-duration")}>考试时长</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[90px]">
                  <PrdAnnotation data={getAnnotation("eu-col-participants")}>参考人数</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[160px]">
                  <PrdAnnotation data={getAnnotation("eu-col-time")}>考试开放时间</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[90px]">
                  <PrdAnnotation data={getAnnotation("eu-col-pass")}>及格人数</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[100px]">
                  <PrdAnnotation data={getAnnotation("eu-col-approval-status")}>状态</PrdAnnotation>
                </TableHead>
                <TableHead className="w-[90px]">
                  <PrdAnnotation data={getAnnotation("eu-col-status")}>考试状态</PrdAnnotation>
                </TableHead>
                <TableHead className="sticky right-0 w-[140px] bg-white text-right">
                  <PrdAnnotation data={getAnnotation("eu-col-actions")}>操作</PrdAnnotation>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                    暂无使用记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsages.map((usage) => (
                  <TableRow key={usage.id} className="group">
                    <TableCell className="font-medium">{usage.examName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDisplayTypeIcon(usage.displayType)}
                        <span className="text-sm">{getDisplayTypeLabel(usage.displayType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {usage.displayType === '教学考试'
                          ? (usage.targetAudience === 'teacher' ? '教师' : '学生')
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {usage.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{usage.duration ? `${usage.duration} 分钟` : '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{usage.participantCount} 人</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usage.startTime && usage.endTime ? (
                        <div className="text-xs">
                          <div>{formatDate(usage.startTime)}</div>
                          <div>至 {formatDate(usage.endTime)}</div>
                        </div>
                      ) : (
                        <span className="text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{usage.passCount !== undefined ? `${usage.passCount} 人` : '-'}</span>
                    </TableCell>
                    <TableCell>
                      {usage.displayType === '教学考试' && usage.approvalStatus ? (
                        <Badge variant="outline" className={cn(
                          usage.approvalStatus === 'draft' && 'bg-gray-100 text-gray-600 border-gray-200',
                          usage.approvalStatus === 'pending' && 'bg-blue-50 text-blue-600 border-blue-200',
                          usage.approvalStatus === 'toPublish' && 'bg-amber-50 text-amber-600 border-amber-200',
                          usage.approvalStatus === 'published' && 'bg-green-50 text-green-600 border-green-200',
                        )}>
                          {APPROVAL_STATUS_LABELS[usage.approvalStatus]}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(usage.status)}</TableCell>
                    <TableCell className="sticky right-0 bg-white text-right relative">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm z-10 px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); openShareDialog(usage) }}>
                          <Share2 className="mr-1 h-3 w-3" />
                          分享考试
                        </Button>
                        {usage.status === 'ended' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/exam-usage/results?usageId=${usage.id}`) }}>
                            <Eye className="mr-1 h-3 w-3" />
                            查看考试结果
                          </Button>
                        )}
                        {usage.status === 'active' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={(e) => { e.stopPropagation(); openEndDialog(usage.id) }}>
                            <XCircle className="mr-1 h-3 w-3" />
                            结束考试
                          </Button>
                        )}
                        {usage.displayType === '教学考试' && usage.approvalStatus === 'pending' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={(e) => { e.stopPropagation(); openWithdrawDialog(usage.id) }}>
                            <Undo2 className="mr-1 h-3 w-3" />
                            撤回审批
                          </Button>
                        )}
                        {usage.displayType === '教学考试' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); alert('此处参考 1.0 版本页面功能即可') }}>
                            <Pencil className="mr-1 h-3 w-3" />
                            编辑
                          </Button>
                        )}
                        {usage.displayType === '教学考试' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); alert('此处参考 1.0 版本页面功能即可') }}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            删除
                          </Button>
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

      {/* 创建在线考试弹窗 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>创建在线考试</DialogTitle>
            <DialogDescription>
              配置考试基本信息，选择试卷并设置考试参数
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-exam-select")}>选择试卷 *</PrdAnnotation>
                </FieldLabel>
                <Popover open={examSelectOpen} onOpenChange={setExamSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedExam
                          ? `${selectedExam.name}（${selectedExam.totalScore}分 / ${selectedExam.questions.length}题）`
                          : "请选择一份试卷"}
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="搜索试卷..." />
                      <CommandList>
                        <CommandEmpty>未找到匹配试卷</CommandEmpty>
                        <CommandGroup>
                          {exams.map((exam) => (
                            <CommandItem
                              key={exam.id}
                              value={exam.id}
                              onSelect={() => {
                                setSelectedExamId(exam.id)
                                setExamSelectOpen(false)
                              }}
                            >
                              <span className="flex-1 truncate">
                                {exam.name}（{exam.totalScore}分 / {exam.questions.length}题）
                              </span>
                              {selectedExamId === exam.id && (
                                <CheckCircle2 className="size-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-exam-name")}>考试名称 *</PrdAnnotation>
                </FieldLabel>
                <Input
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="请输入考试名称"
                />
              </Field>

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-exam-desc")}>考试简介</PrdAnnotation>
                </FieldLabel>
                <Textarea
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  placeholder="请输入考试简介（可选）"
                  rows={2}
                />
              </Field>

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-exam-notice")}>考试须知</PrdAnnotation>
                </FieldLabel>
                <Textarea
                  value={examNotice}
                  onChange={(e) => setExamNotice(e.target.value)}
                  placeholder="请输入考试须知"
                  rows={5}
                />
              </Field>

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-cover")}>考试封面</PrdAnnotation>
                </FieldLabel>
                <FieldDescription>支持上传 5MB 以内的图片文件</FieldDescription>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                {coverUrl ? (
                  <div className="relative mt-2 w-full overflow-hidden rounded-lg border">
                    <img
                      src={coverUrl}
                      alt="封面预览"
                      className="h-32 w-full object-cover"
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
                    <ImageIcon className="mb-2 size-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">点击上传封面</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-target-audience")}>面向对象</PrdAnnotation>
                </FieldLabel>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetAudience"
                      checked={targetAudience === 'student'}
                      onChange={() => setTargetAudience('student')}
                    />
                    <span className="text-sm">学生</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetAudience"
                      checked={targetAudience === 'teacher'}
                      onChange={() => setTargetAudience('teacher')}
                    />
                    <span className="text-sm">教师</span>
                  </label>
                </div>
              </Field>

              {targetAudience === 'student' && (
                <Field>
                  <FieldLabel>
                    <PrdAnnotation data={getAnnotation("ecd-target-student")}>参考学生</PrdAnnotation>
                  </FieldLabel>
                  <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        <span className="truncate">
                          {selectedClassIds.length === 0
                            ? "请选择参考学生"
                            : `已选 ${selectedClassIds.length} 人`
                          }
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <div className="border-b p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="搜索学生或班级..."
                            value={orgSearch}
                            onChange={(e) => setOrgSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[280px] overflow-hidden">
                        <div className="p-2">
                          {mockOrgClasses.map(node => renderOrgNode(node, 0))}
                        </div>
                      </ScrollArea>
                      {selectedClassIds.length > 0 && (
                        <div className="border-t p-2">
                          <div className="mb-1 text-xs text-muted-foreground">已选学生</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedClassIds.map(id => (
                              <Badge key={id} variant="secondary" className="gap-1">
                                {nodeNameMap.get(id) || id}
                                <button
                                  type="button"
                                  onClick={() => handleToggleClass(id)}
                                  className="ml-1 rounded-full hover:bg-muted"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </Field>
              )}

              {targetAudience === 'teacher' && (
                <Field>
                  <FieldLabel>
                    <PrdAnnotation data={getAnnotation("ecd-target-teacher")}>参考人员</PrdAnnotation>
                  </FieldLabel>
                  <div className="space-y-2">
                    {selectedTeacherIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTeacherIds.map(id => {
                          const teacher = mockUsers.find(u => u.id === id)
                          return (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {teacher?.name || id}
                              <button
                                type="button"
                                onClick={() => setSelectedTeacherIds(prev => prev.filter(tid => tid !== id))}
                                className="ml-1 rounded-full hover:bg-muted"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                      onClick={() => setTeacherDialogOpen(true)}
                    >
                      <Users className="mr-2 size-4 text-muted-foreground" />
                      {selectedTeacherIds.length === 0 ? "请选择参考人员" : `已选 ${selectedTeacherIds.length} 人`}
                    </Button>
                  </div>
                </Field>
              )}

              <Field>
                <FieldLabel>
                  <PrdAnnotation data={getAnnotation("ecd-open-type")}>考试时间</PrdAnnotation>
                </FieldLabel>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted">
                    <input type="radio" name="openType" checked={examOpenType === 'anytime'} onChange={() => setExamOpenType('anytime')} />
                    <span className="text-sm">随时开放</span>
                  </label>
                  <label className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted">
                    <input type="radio" name="openType" checked={examOpenType === 'scheduled'} onChange={() => setExamOpenType('scheduled')} />
                    <span className="text-sm">定期开放</span>
                  </label>
                  {examOpenType === 'scheduled' && (
                    <div className="flex items-center gap-2 pl-6">
                      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
                      <span className="text-sm text-muted-foreground">至</span>
                      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted">
                    <input type="radio" name="openType" checked={examOpenType === 'manual'} onChange={() => setExamOpenType('manual')} />
                    <span className="text-sm">手动开放（在列表中点击“开放考试”按钮）</span>
                  </label>
                </div>
              </Field>

              <Field>
                <FieldLabel>是否发布到前台考试中心</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch checked={publishToFront} onCheckedChange={setPublishToFront} />
                  <span className="text-sm text-muted-foreground">{publishToFront ? '是' : '否'}</span>
                </div>
              </Field>
            </FieldGroup>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateExam} disabled={!isFormValid}>
              创建考试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择参考人员弹窗 */}
      <CoBuilderDialog
        open={teacherDialogOpen}
        onOpenChange={setTeacherDialogOpen}
        annotationContext="exam-usage-co-builder"
        title="选择参考人员"
        description="选择参加考试的教师"
        selectedIds={selectedTeacherIds}
        onChange={setSelectedTeacherIds}
      />

      {/* 分享考试弹窗 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分享考试</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {sharingUsage && (
              <p className="text-sm text-muted-foreground">
                你的考试 {sharingUsage.examName} 开放时间为 {sharingUsage.startTime ? formatDate(sharingUsage.startTime) : '-'}-{sharingUsage.endTime ? formatDate(sharingUsage.endTime) : '-'}，请尽快点击下面链接参加考试吧 https://exam.example.com/e/{sharingUsage.id}
              </p>
            )}
            <Button onClick={handleCopyLink} className="w-full">
              {copied ? '已复制' : '复制到剪贴板'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 撤回审批确认弹窗 */}
      <ConfirmDialog
        open={confirmWithdrawOpen}
        onOpenChange={setConfirmWithdrawOpen}
        title="撤回审批"
        description="撤回后考试将回到草稿状态，可以继续编辑。确定要撤回吗？"
        onConfirm={handleWithdrawApproval}
      />

      {/* 结束考试确认弹窗 */}
      <ConfirmDialog
        open={confirmEndOpen}
        onOpenChange={setConfirmEndOpen}
        title="结束考试"
        description="结束考试后，学生将无法继续答题，且状态将变为已结束。确定要结束吗？"
        onConfirm={handleEndExam}
      />
    </div>
  )
}
