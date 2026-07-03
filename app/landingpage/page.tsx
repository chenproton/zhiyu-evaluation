"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import {
  Clock, Calendar, FileText, BookOpen, Users, Award,
  BarChart3, Target, TrendingUp, Layers, Star, CheckCircle2,
  MapPin, Zap, Eye, Search, ClipboardList,
} from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { PrdAnnotation } from "@/components/prd-annotation"
import { getAnnotation } from "@/lib/prd-annotations"

function SectionHeader({ title, subtitle, moreHref }: { title: string; subtitle?: string; moreHref?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: "bold", color: "#1e293b", position: "relative", paddingLeft: 12 }}>
          <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 4, height: 20, background: "linear-gradient(180deg, #2563eb, #3b82f6)", borderRadius: 2 }} />
          {title}
        </h2>
        {subtitle && <span style={{ color: "#94a3b8", fontSize: 13 }}>{subtitle}</span>}
      </div>
      {moreHref && (
        <Link href={moreHref} style={{ color: "#2563eb", fontSize: 13, textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}>
          查看全部 ›
        </Link>
      )}
    </div>
  )
}

const examStatusMap: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: "#dcfce7", color: "#16a34a", label: "进行中" },
  draft: { bg: "#f1f5f9", color: "#64748b", label: "草稿" },
  pending: { bg: "#dbeafe", color: "#2563eb", label: "审核中" },
}

const MOCK_POSITIONS = [
  "全部",
  "前端开发工程师",
  "后端开发工程师",
  "全栈开发工程师",
  "算法工程师",
  "网络安全工程师",
  "UI设计师",
  "Java开发工程师",
  "Python开发工程师",
  "移动端开发工程师",
  "测试工程师",
  "运维工程师",
  "产品经理",
  "数据分析师",
  "嵌入式开发工程师",
  "云计算工程师",
  "DevOps工程师",
  "架构师",
  "技术经理",
  "数据库管理员",
]

function PositionFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MOCK_POSITIONS : MOCK_POSITIONS.slice(0, 8)

  const toggle = (pos: string) => {
    if (pos === "全部") {
      onChange(["全部"])
      return
    }
    let next = selected.includes(pos)
      ? selected.filter((s) => s !== pos)
      : [...selected.filter((s) => s !== "全部"), pos]
    if (next.length === 0) next = ["全部"]
    onChange(next)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>岗位筛选：</span>
        {visible.map((pos) => (
          <button
            key={pos}
            onClick={() => toggle(pos)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              border: "none", fontWeight: 500, transition: "all 0.2s",
              background: selected.includes(pos) ? "#2563eb" : "#f1f5f9",
              color: selected.includes(pos) ? "#fff" : "#64748b",
            }}
          >
            {pos}
          </button>
        ))}
        {MOCK_POSITIONS.length > 8 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              fontWeight: 500, transition: "all 0.2s",
              background: "#fff", color: "#2563eb", border: "1px solid #2563eb",
            }}
          >
            {expanded ? "收起" : "展开更多"}
          </button>
        )}
      </div>
    </div>
  )
}

const certStatusMap: Record<string, string> = {
  published: "进行中", ready: "待发布", reviewing: "审核中",
  rejected: "已驳回", draft: "草稿", none: "无规则",
}

function getMockTargetAudience(examId: string): { type: string; detail: string } {
  const map: Record<string, { type: string; detail: string }> = {
    "exam-1": { type: "学生", detail: "2024级前端1班、2024级前端2班" },
    "exam-2": { type: "学生", detail: "2024级软件工程1班、2024级软件工程2班" },
    "exam-3": { type: "学生", detail: "2023级计算机班" },
    "exam-4": { type: "教师", detail: "张三、李四、王五" },
    "exam-5": { type: "学生", detail: "2024级网络工程班" },
    "exam-6": { type: "学生", detail: "2023级全栈开发班、2024级全栈开发班" },
  }
  return map[examId] || { type: "学生", detail: "2024级默认班" }
}

export default function LandingHomePage() {
  const {
    exams, questionBanks, evaluationCategories, evaluationMethods,
    graduationProjectTopics, studentAbilityPortraits, positionsList,
  } = useData()

  const [activeMethodCategory, setActiveMethodCategory] = useState("全部")
  const [activeMethodSub, setActiveMethodSub] = useState("全部")
  const [activeResourceTab, setActiveResourceTab] = useState("题库")
  const [portraitMajor, setPortraitMajor] = useState("全部")
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["全部"])

  /* ── 统计数据 ── */
  const stats = useMemo(() => [
    { num: evaluationMethods.length, label: "测评方式" },
    { num: questionBanks.length, label: "题库数量" },
    { num: exams.length, label: "试卷数量" },
    { num: exams.filter((e) => e.status === "published").length, label: "考试场次" },
    { num: positionsList.length, label: "岗位认证项目" },
    { num: graduationProjectTopics.length, label: "毕业选题" },
  ], [evaluationMethods, questionBanks, exams, positionsList, graduationProjectTopics])

  /* ── 考试中心 ── */
  const publishedExams = exams.filter((e) => e.status === "published").slice(0, 4)

  /* ── 测评方式 ── */
  const methodCategoryTabs = ["全部", ...evaluationCategories.map((c) => c.name)]

  const availableSubCategories = useMemo(() => {
    const subs = new Set<string>()
    evaluationMethods.filter((m) => m.enabled).forEach((m) => {
      if (activeMethodCategory === "全部") {
        subs.add(m.subCategoryName || '-')
      } else {
        const cat = evaluationCategories.find((c) => c.id === m.categoryId)
        if (cat?.name === activeMethodCategory) {
          subs.add(m.subCategoryName || '-')
        }
      }
    })
    return ["全部", ...Array.from(subs)]
  }, [activeMethodCategory, evaluationMethods, evaluationCategories])

  const filteredMethods = useMemo(() => {
    let methods = evaluationMethods.filter((m) => m.enabled)
    if (activeMethodCategory !== "全部") {
      methods = methods.filter((m) => {
        const cat = evaluationCategories.find((c) => c.id === m.categoryId)
        return cat?.name === activeMethodCategory
      })
    }
    if (activeMethodSub !== "全部") {
      methods = methods.filter((m) => (m.subCategoryName || '-') === activeMethodSub)
    }
    return methods.slice(0, 8)
  }, [evaluationMethods, activeMethodCategory, activeMethodSub, evaluationCategories])

  /* ── 测评资源 ── */
  const resourceBanks = questionBanks.filter((b) => b.status === "published").slice(0, 3)
  const resourceExams = exams.filter((e) => e.status === "published").slice(0, 3)

  /* ── 毕业设计 ── */
  const publishedTopics = graduationProjectTopics.filter((t) => t.status === "published").slice(0, 6)

  /* ── 画像 ── */
  const topPortraits = studentAbilityPortraits.slice().sort((a, b) => b.totalCredits - a.totalCredits).slice(0, 8)
  const majors = ["全部", ...Array.from(new Set(studentAbilityPortraits.map((p) => p.majorName)))]

  const filteredPortraits = topPortraits.filter((p) => {
    const matchMajor = portraitMajor === "全部" || p.majorName === portraitMajor
    const matchPos = selectedPositions.includes("全部") || selectedPositions.includes(p.positionName)
    return matchMajor && matchPos
  })

  return (
    <div>
      {/* ═══ Hero Banner ═══ */}
      <div style={{
        backgroundImage: "url('/2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff", padding: "60px 20px 50px", textAlign: "center", position: "relative", overflow: "hidden", minHeight: 360,
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.55)" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
           <h1 style={{ fontSize: 40, fontWeight: "bold", marginBottom: 12, letterSpacing: 1 }}>能力评价与测评资源管理平台</h1>
          <p style={{ fontSize: 15, opacity: 0.85, marginBottom: 28 }}>集测评资源、岗位能力认定、毕业设计、学生画像于一体的一站式能力成长平台</p>
          <div style={{
            background: "#fff", borderRadius: 50, padding: "5px 5px 5px 24px",
            display: "flex", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}>
            <Search style={{ width: 18, height: 18, color: "#94a3b8", marginRight: 10 }} />
            <input type="text" placeholder="搜索题库、试卷、考试、岗位能力认证、毕业设计、学生画像"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "12px 0", color: "#333", background: "transparent" }} />
            <button style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", border: "none",
              padding: "11px 32px", borderRadius: 50, cursor: "pointer", fontSize: 14, fontWeight: 500,
            }}>搜索</button>
          </div>
        </div>
      </div>

      {/* ═══ 主内容 ═══ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px 0" }}>

        <PrdAnnotation data={getAnnotation("lp-stats")}>
          {/* ── 数据看板 ── */}
          <section style={{ marginBottom: 50 }}>
          <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 24,
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 20,
          }}>
            {stats.map((s, i) => {
              const statIds = ["lp-stat-eval", "lp-stat-bank", "lp-stat-exam", "lp-stat-usage", "lp-stat-position", "lp-stat-topic"]
              return (
                <PrdAnnotation key={i} data={getAnnotation(statIds[i])}>
                <div style={{ textAlign: "center", borderRight: i < stats.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: "#2563eb", lineHeight: 1.2 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>{s.label}</div>
                </div>
                </PrdAnnotation>
              )
            })}
          </div>
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-exam-center")}>
          {/* ── 考试中心 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="考试中心" subtitle="所有已发布的考试" moreHref="/landingpage/exams" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publishedExams.map((exam) => {
              const st = examStatusMap[exam.status] || examStatusMap.draft
              const audience = getMockTargetAudience(exam.id)
              return (
                <Link key={exam.id} href={`/landingpage/exams/${exam.id}`} className="block" style={{ textDecoration: "none", color: "inherit" }}>
                  <PrdAnnotation data={getAnnotation("lp-exam-card")}>
                  <div
                    className="h-full cursor-pointer rounded-xl bg-white p-5 transition-all duration-300"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget
                      el.style.transform = "translateY(-4px)"
                      el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget
                      el.style.transform = "translateY(0)"
                      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: "#eff6ff", color: "#2563eb" }}
                      >
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-gray-900">{exam.name}</h3>
                    <p className="mb-3 text-sm text-gray-500 line-clamp-2">
                      {exam.id === "exam-1" ? "考察 JavaScript、React 基础知识" : exam.id === "exam-2" ? "TypeScript 类型系统与高级特性测验" : exam.id === "exam-3" ? "React Hooks 与性能优化专项考核" : exam.id === "exam-4" ? "Node.js 基础与 Express 框架测试" : exam.id === "exam-5" ? "Vue3 组合式 API 与响应式原理" : exam.id === "exam-6" ? "前后端技术栈综合知识考核" : "综合知识考核"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.duration} 分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {exam.questions.length} 题
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exam.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      考试对象：{audience.detail}
                    </div>
                    {exam.status === "published" && (
                      <div className="mt-4">
                        <span
                          className="block w-full rounded-lg py-2 text-center text-sm font-medium"
                          style={{ background: "#2563eb", color: "#fff" }}
                        >
                          去考试
                        </span>
                      </div>
                    )}
                  </div>
                  </PrdAnnotation>
                </Link>
              )
            })}
            {publishedExams.length === 0 && (
              <div style={{ gridColumn: "span 4", textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 10 }}>暂无已发布考试</div>
            )}
          </div>
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-certifications")}>
          {/* ── 岗位能力认证 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="岗位能力认证项目库" moreHref="/landingpage/certifications" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {positionsList.slice(0, 5).map((pos, i) => {
              const covers = [
                "linear-gradient(135deg, #667eea, #764ba2)",
                "linear-gradient(135deg, #f093fb, #f5576c)",
                "linear-gradient(135deg, #4facfe, #00f2fe)",
                "linear-gradient(135deg, #fa709a, #fee140)",
                "linear-gradient(135deg, #30cfd0, #330867)",
              ]
              return (
                <Link key={pos.id} href={`/landingpage/certifications/${pos.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <PrdAnnotation data={getAnnotation("lp-cert-card")}>
                  <div style={{
                    background: "#fff", borderRadius: 10, overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s", cursor: "pointer",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{
                      height: 100, background: covers[i % 5], position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: "bold",
                    }}>
                      {pos.name}
                    </div>
                    <div style={{ padding: 14 }}>
                      <h3 style={{ fontSize: 14, marginBottom: 8, color: "#1e293b", fontWeight: 600 }}>{pos.name}认证</h3>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
                        创建人：{pos.updatedBy} &nbsp; 更新：{pos.lastUpdated}<br />
                        适用专业：{pos.professionalDirection}
                      </div>
                      <div style={{
                        display: "flex", justifyContent: "center", marginTop: 10,
                        paddingTop: 10, borderTop: "1px dashed #f1f5f9",
                      }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: "bold", color: "#2563eb" }}>{pos.relatedAbilityCount}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>能力项</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </PrdAnnotation>
                </Link>
              )
            })}
          </div>
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-evaluation-methods")}>
          {/* ── 测评方式 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="测评方式库" moreHref="/landingpage/evaluation-methods" />
          <div style={{ background: "#fff", padding: "15px 20px", borderRadius: 10, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {/* 一级分类 */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #f1f5f9", fontSize: 13 }}>
              <span style={{ color: "#94a3b8", width: 80, flexShrink: 0 }}>一级分类：</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {methodCategoryTabs.map((tab) => (
                  <span key={tab} onClick={() => { setActiveMethodCategory(tab); setActiveMethodSub("全部") }} style={{
                    padding: "4px 12px", borderRadius: 4, cursor: "pointer",
                    color: activeMethodCategory === tab ? "#2563eb" : "#64748b",
                    background: activeMethodCategory === tab ? "#eff6ff" : "transparent",
                    fontWeight: activeMethodCategory === tab ? 500 : 400,
                    transition: "all 0.3s",
                  }}>
                    {tab}
                  </span>
                ))}
              </div>
            </div>
            {/* 二级分类 */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 0", fontSize: 13 }}>
              <span style={{ color: "#94a3b8", width: 80, flexShrink: 0 }}>二级分类：</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {availableSubCategories.map((sub) => (
                  <span key={sub} onClick={() => setActiveMethodSub(sub)} style={{
                    padding: "4px 12px", borderRadius: 4, cursor: "pointer",
                    color: activeMethodSub === sub ? "#2563eb" : "#64748b",
                    background: activeMethodSub === sub ? "#eff6ff" : "transparent",
                    fontWeight: activeMethodSub === sub ? 500 : 400,
                    transition: "all 0.3s",
                  }}>
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {filteredMethods.map((method, i) => {
              const covers = [
                "linear-gradient(135deg, #a8edea, #fed6e3)",
                "linear-gradient(135deg, #ffecd2, #fcb69f)",
                "linear-gradient(135deg, #84fab0, #8fd3f4)",
                "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
              ]
              const icons = ["📝", "💻", "🎤", "📁"]
              return (
                <PrdAnnotation key={method.id} data={getAnnotation("lp-method-card")}>
                <div style={{
                    background: "#fff", borderRadius: 10, overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s", cursor: "pointer",
                  }}
                  onClick={() => method.docLink && window.open(method.docLink, '_blank')}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{
                    height: 110, background: covers[i % 4],
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
                  }}>{icons[i % 4]}</div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 14, marginBottom: 8, color: "#1e293b", fontWeight: 600 }}>{method.name}</h3>
                    <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 12, height: 36, overflow: "hidden" }}>
                      {method.description || "暂无说明"}
                    </p>
                    <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 500 }}>查看使用说明 ›</span>
                  </div>
                </div>
                </PrdAnnotation>
              )
            })}
            {filteredMethods.length === 0 && (
              <div style={{ gridColumn: "span 4", textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 10 }}>暂无测评方式</div>
            )}
          </div>
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-resources")}>
          {/* ── 测评资源 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="测评资源库" moreHref="/landingpage/resources" />
          <div style={{ display: "flex", gap: 30, borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
            {["题库", "试卷库"].map((tab) => (
              <button key={tab} onClick={() => setActiveResourceTab(tab)} style={{
                padding: "10px 0", fontSize: 15, cursor: "pointer", position: "relative",
                color: activeResourceTab === tab ? "#2563eb" : "#64748b",
                fontWeight: activeResourceTab === tab ? "bold" : "normal",
                border: "none", background: "none",
              }}>
                {tab}
                {activeResourceTab === tab && (
                  <span style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 2, background: "#2563eb" }} />
                )}
              </button>
            ))}
          </div>

          {activeResourceTab === "题库" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {resourceBanks.map((bank, i) => {
                const covers = [
                  "linear-gradient(135deg, #fa709a, #fee140)",
                  "linear-gradient(135deg, #30cfd0, #330867)",
                  "linear-gradient(135deg, #a8c0ff, #3f2b96)",
                ]
                return (
                  <Link key={bank.id} href={`/landingpage/resources/banks/${bank.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <PrdAnnotation data={getAnnotation("lp-resource-bank-card")}>
                    <div style={{
                      background: "#fff", borderRadius: 10, overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <div style={{
                        height: 100, background: covers[i % 3],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 20, fontWeight: "bold",
                      }}>{bank.name.slice(0, 6)}</div>
                      <div style={{ padding: 16 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 10, color: "#1e293b", fontWeight: 600 }}>{bank.name}</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#64748b" }}>
                          <span>题目数量：<strong style={{ color: "#2563eb" }}>{bank.questionCount}</strong></span>
                          <span>题型：选择/编程</span>
                          <span>创建人：{bank.creatorId || "系统"}</span>
                          <span>共建：{bank.collaboratorIds?.length || 0}人</span>
                          <span>创建：{new Date(bank.createdAt).toLocaleDateString("zh-CN")}</span>
                          <span>更新：{new Date(bank.updatedAt).toLocaleDateString("zh-CN")}</span>
                          <span>版本：{bank.version}</span>
                          <span>编码：{bank.id.slice(0, 6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    </PrdAnnotation>
                  </Link>
                )
              })}
              {resourceBanks.length === 0 && (
                <div style={{ gridColumn: "span 3", textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 10 }}>暂无题库</div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {resourceExams.map((exam, i) => {
                const covers = [
                  "linear-gradient(135deg, #fa709a, #fee140)",
                  "linear-gradient(135deg, #30cfd0, #330867)",
                  "linear-gradient(135deg, #a8c0ff, #3f2b96)",
                ]
                return (
                  <Link key={exam.id} href={`/landingpage/resources/exams/${exam.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <PrdAnnotation data={getAnnotation("lp-resource-exam-card")}>
                    <div style={{
                      background: "#fff", borderRadius: 10, overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <div style={{
                        height: 100, background: covers[i % 3],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 20, fontWeight: "bold",
                      }}>{exam.name.slice(0, 6)}</div>
                      <div style={{ padding: 16 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 10, color: "#1e293b", fontWeight: 600 }}>{exam.name}</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#64748b" }}>
                          <span>时长：<strong style={{ color: "#2563eb" }}>{exam.duration}分钟</strong></span>
                          <span>题数：{exam.questions.length}题</span>
                          <span>总分：{exam.questions.reduce((s, q) => s + q.score, 0)}分</span>
                          <span>版本：{exam.version}</span>
                          <span>创建：{new Date(exam.createdAt).toLocaleDateString("zh-CN")}</span>
                          <span>更新：{new Date(exam.updatedAt).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                    </div>
                    </PrdAnnotation>
                  </Link>
                )
              })}
              {resourceExams.length === 0 && (
                <div style={{ gridColumn: "span 3", textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 10 }}>暂无试卷</div>
              )}
            </div>
          )}
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-graduation")}>
          {/* ── 毕业设计 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="毕业设计选题中心" subtitle="去选题中心" moreHref="/landingpage/graduation" />
          <div style={{ background: "#fff", padding: "15px 20px", borderRadius: 10, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {[
              { label: "院系：", tags: ["全部", "计算机学院", "软件学院", "信息学院", "大数据学院"] },
              { label: "专业：", tags: ["全部", "计算机科学与技术", "软件工程", "网络工程", "数据科学"] },
              { label: "岗位：", tags: ["全部", "Java开发", "前端开发", "算法工程师", "运维工程师"] },
              { label: "标签：", tags: ["全部", "热门", "创新", "实战", "前沿"] },
            ].map((row, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: idx < 3 ? "1px dashed #f1f5f9" : "none", fontSize: 13 }}>
                <span style={{ color: "#94a3b8", width: 60, flexShrink: 0 }}>{row.label}</span>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {row.tags.map((tag) => (
                    <span key={tag} style={{
                      padding: "4px 12px", borderRadius: 4, cursor: "pointer", color: "#64748b",
                      transition: "all 0.3s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {publishedTopics.map((topic) => (
              <Link key={topic.id} href={`/landingpage/graduation/${topic.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <PrdAnnotation data={getAnnotation("lp-grad-card")}>
                <div style={{
                  background: "#fff", borderRadius: 10, padding: 18,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s",
                  cursor: "pointer", borderLeft: "4px solid #3b82f6",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ fontSize: 14, marginBottom: 10, lineHeight: 1.5, color: "#1e293b", fontWeight: 600 }}>{topic.name}</h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                    📚 {topic.positionName} · 👨‍🏫 {topic.advisorName} · 🏷️ {topic.source === "scene" ? "校内" : "企业"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px dashed #f1f5f9" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                      <Eye style={{ width: 12, height: 12 }} /> {topic.appliedCount}次浏览
                    </span>
                    <button style={{
                      background: "#2563eb", color: "#fff", padding: "6px 14px",
                      borderRadius: 4, fontSize: 12, cursor: "pointer", border: "none",
                    }}>加入毕设选题</button>
                  </div>
                </div>
                </PrdAnnotation>
              </Link>
            ))}
            {publishedTopics.length === 0 && (
              <div style={{ gridColumn: "span 3", textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 10 }}>暂无选题</div>
            )}
          </div>
        </section>
        </PrdAnnotation>

        <PrdAnnotation data={getAnnotation("lp-portraits")}>
          {/* ── 学生画像排行榜 ── */}
          <section style={{ marginBottom: 50 }}>
          <SectionHeader title="学生画像排行榜" subtitle="按岗位查看关联专业排行榜" />
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {/* 岗位筛选 — 平铺多选，模拟20个，可展开 */}
            <PositionFilter selected={selectedPositions} onChange={setSelectedPositions} />

            {/* 关联专业卡片 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {(selectedPositions.includes("全部")
                ? Array.from(new Set(studentAbilityPortraits.map((p) => p.majorName))).map((majorName) => ({
                    majorName,
                    students: studentAbilityPortraits.filter((p) => p.majorName === majorName),
                  }))
                : Array.from(
                    new Set(
                      studentAbilityPortraits
                        .filter((p) => selectedPositions.includes(p.positionName))
                        .map((p) => p.majorName)
                    )
                  ).map((majorName) => ({
                    majorName,
                    students: studentAbilityPortraits.filter(
                      (p) => p.majorName === majorName && selectedPositions.includes(p.positionName)
                    ),
                  }))
              ).map(({ majorName, students }, i) => {
                const gradeMap: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 }
                const avgGradeVal =
                  students.reduce((s, p) => s + (gradeMap[p.overallGrade] || 3), 0) / students.length
                const avgGradeLetter =
                  avgGradeVal >= 4.5 ? "A" : avgGradeVal >= 3.5 ? "B" : avgGradeVal >= 2.5 ? "C" : avgGradeVal >= 1.5 ? "D" : "E"
                const avgRankPct =
                  students.reduce((s, p) => s + (p.majorRank / p.majorTotal) * 100, 0) / students.length
                const avgCredits =
                  students.reduce((s, p) => s + p.totalCredits, 0) / students.length
                const covers = [
                  "linear-gradient(135deg, #667eea, #764ba2)",
                  "linear-gradient(135deg, #f093fb, #f5576c)",
                  "linear-gradient(135deg, #4facfe, #00f2fe)",
                  "linear-gradient(135deg, #fa709a, #fee140)",
                  "linear-gradient(135deg, #30cfd0, #330867)",
                  "linear-gradient(135deg, #a8edea, #fed6e3)",
                ]
                return (
                  <Link key={majorName} href={`/landingpage/portrait/major/${encodeURIComponent(majorName)}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <PrdAnnotation data={getAnnotation("lp-portrait-card")}>
                    <div style={{
                      background: "#fff", borderRadius: 10, overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.25s", cursor: "pointer",
                      border: "1px solid #f1f5f9",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <div style={{
                        height: 100, background: covers[i % covers.length], position: "relative",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 18, fontWeight: "bold",
                      }}>
                        {majorName.slice(0, 6)}
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 10, color: "#1e293b", fontWeight: 600 }}>{majorName}</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#64748b" }}>
                          <span>学生数量：<strong style={{ color: "#2563eb" }}>{students.length} 人</strong></span>
                          <span>平均评级：<strong style={{ color: "#f59e0b" }}>{avgGradeLetter}</strong></span>
                          <span>平均学分：<strong>{avgCredits.toFixed(1)}</strong></span>
                          <span>平均排名：<strong>{avgRankPct.toFixed(1)}%</strong></span>
                        </div>
                        <div style={{
                          marginTop: 12, paddingTop: 12, borderTop: "1px dashed #f1f5f9",
                          textAlign: "center", fontSize: 13, color: "#2563eb", fontWeight: 500,
                        }}>
                          查看专业排行榜 ›
                        </div>
                      </div>
                    </div>
                    </PrdAnnotation>
                  </Link>
                )
              })}
              {(selectedPositions.includes("全部")
                ? Array.from(new Set(studentAbilityPortraits.map((p) => p.majorName)))
                : Array.from(new Set(studentAbilityPortraits.filter((p) => selectedPositions.includes(p.positionName)).map((p) => p.majorName)))
              ).length === 0 && (
                <div style={{ gridColumn: "span 3", textAlign: "center", padding: 40, color: "#94a3b8" }}>暂无关联专业</div>
              )}
            </div>
          </div>
        </section>
        </PrdAnnotation>

      </div>
    </div>
  )
}
