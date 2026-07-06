"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import type {
  QuestionBank,
  Question,
  Exam,
  ExamQuestion,
  Status,
  QuestionBankFormData,
  QuestionFormData,
  ExamFormData,
  StatusAction,
  EvaluationMethodCategory,
  EvaluationMethod,
  SceneTask,
  SceneEvaluationResult,
  JobAbilityResult,
  Position,
  ApprovalItem,
  GraduationProjectTopic,
  GraduationProjectArchive,
  GraduationProjectEvaluation,
  GraduationQueryResult,
  StudentAbilityArchive,
  StudentAbilityPortrait,
  ProcessEvaluation,
  RectificationDetail,
  AppealRecord,
  CreditConversionRule,
  ArchiveVersion,
  EvaluationStandard,
  PortraitUpdateConfig,
  TopicApplication,
  SceneGradingStudent,
  SceneGradingScenario,
  SceneGradingSubmission,
  OnlineClassroom,
  SmartCourse,
  AbilityItem,
  CertType,
  MicroCertTemplate,
  CertIssuanceRecord,
  MicroCertTemplateFormData,
} from '@/lib/types'
import { getNextStatus, canPerformAction } from '@/lib/types'
import {
  mockQuestionBanks,
  mockQuestions,
  mockExams,
  mockEvaluationCategories,
  mockEvaluationMethods,
  mockSceneTasks,
  mockSceneEvaluationResults,
  mockJobAbilityResults,
  positionsList,
  mockApprovalItems,
  mockGraduationProjectTopics,
  mockGraduationProjectArchives,
  mockGraduationProjectEvaluations,
  mockGraduationQueryResults,
  mockStudentAbilityArchives,
  mockStudentAbilityPortraits,
  mockProcessEvaluations,
  mockRectificationDetails,
  mockAppealRecords,
  mockCreditConversionRules,
  mockArchiveVersions,
  mockEvaluationStandards,
  mockTopicApplications,
  sceneGradingStudents,
  sceneGradingScenarios,
  sceneGradingSubmissions,
  mockOnlineClassrooms,
  mockSmartCourses,
  positionAbilityItemsMap,
  abilityItems,
  mockCertTypes,
  mockMicroCertTemplates,
  mockCertIssuanceRecords,
} from '@/lib/mock-data'

interface DataContextValue {
  // 题库相关
  questionBanks: QuestionBank[]
  getQuestionBank: (id: string) => QuestionBank | undefined
  createQuestionBank: (data: QuestionBankFormData) => QuestionBank
  updateQuestionBank: (id: string, data: QuestionBankFormData) => void
  deleteQuestionBank: (id: string) => void
  updateQuestionBankStatus: (id: string, action: StatusAction) => void

  // 题目相关
  questions: Question[]
  getQuestionsByBank: (bankId: string) => Question[]
  getQuestion: (id: string) => Question | undefined
  createQuestion: (bankId: string, data: QuestionFormData) => Question
  updateQuestion: (id: string, data: QuestionFormData) => void
  deleteQuestion: (id: string) => void
  updateQuestionStatus: (id: string, action: StatusAction) => void
  moveQuestions: (questionIds: string[], targetBankId: string) => void

  // 试卷相关
  exams: Exam[]
  getExam: (id: string) => Exam | undefined
  createExam: (data: ExamFormData) => Exam
  updateExam: (id: string, data: Partial<Exam>) => void
  deleteExam: (id: string) => void
  updateExamStatus: (id: string, action: StatusAction) => void
  addQuestionToExam: (examId: string, question: Question, score?: number) => void
  removeQuestionFromExam: (examId: string, examQuestionId: string) => void
  updateExamQuestionScore: (examId: string, examQuestionId: string, score: number) => void
  reorderExamQuestions: (examId: string, questions: ExamQuestion[]) => void

  // 场景任务测评相关
  evaluationCategories: EvaluationMethodCategory[]
  evaluationMethods: EvaluationMethod[]
  sceneTasks: SceneTask[]
  sceneEvaluationResults: SceneEvaluationResult[]
  updateEvaluationMethod: (id: string, data: Partial<EvaluationMethod>) => void
  getSceneTasksByMethod: (methodId: string) => SceneTask[]
  getResultsByMethod: (methodId: string) => SceneEvaluationResult[]

  // 场景任务评价（从 zhiyu-scene 迁移）
  sceneGradingStudents: SceneGradingStudent[]
  sceneGradingScenarios: SceneGradingScenario[]
  sceneGradingSubmissions: SceneGradingSubmission[]

  // 在线课堂评价
  onlineClassrooms: OnlineClassroom[]

  // 智慧课程评价
  smartCourses: SmartCourse[]

  // 岗位能力测评结果
  jobAbilityResults: JobAbilityResult[]
  positionsList: Position[]
  getPositionAbilityItems: (positionId: string) => AbilityItem[]

  // 审批中心
  approvalItems: ApprovalItem[]
  approveItem: (id: string, remark?: string) => void
  rejectItem: (id: string, remark?: string) => void

  // 毕业设计管理
  graduationProjectTopics: GraduationProjectTopic[]
  graduationProjectArchives: GraduationProjectArchive[]
  graduationProjectEvaluations: GraduationProjectEvaluation[]
  graduationQueryResults: GraduationQueryResult[]
  processEvaluations: ProcessEvaluation[]
  rectificationDetails: RectificationDetail[]
  appealRecords: AppealRecord[]
  evaluationStandards: EvaluationStandard[]
  topicApplications: TopicApplication[]
  createTopicApplication: (data: any) => TopicApplication
  updateTopicApplication: (id: string, data: Partial<TopicApplication>) => void
  createProcessEvaluation: (data: any) => ProcessEvaluation
  createRectificationDetail: (data: any) => RectificationDetail
  updateRectificationDetail: (id: string, data: Partial<RectificationDetail>) => void
  createAppealRecord: (data: any) => AppealRecord
  updateAppealRecord: (id: string, data: Partial<AppealRecord>) => void
  updateEvaluationStandard: (id: string, data: Partial<EvaluationStandard>) => void

  // 学生能力画像管理
  studentAbilityArchives: StudentAbilityArchive[]
  studentAbilityPortraits: StudentAbilityPortrait[]
  creditConversionRules: CreditConversionRule[]
  archiveVersions: ArchiveVersion[]
  portraitUpdateConfig: PortraitUpdateConfig

  // 毕业设计管理操作
  createGraduationProjectTopic: (data: any) => GraduationProjectTopic
  updateGraduationProjectTopic: (id: string, data: any) => void
  deleteGraduationProjectTopic: (id: string) => void
  updateGraduationProjectArchive: (id: string, data: Partial<GraduationProjectArchive>) => void
  updateGraduationProjectEvaluation: (id: string, data: Partial<GraduationProjectEvaluation>) => void

  // 学生能力画像管理操作
  createStudentAbilityArchive: (data: any) => StudentAbilityArchive
  updateStudentAbilityArchive: (id: string, data: Partial<StudentAbilityArchive>) => void
  deleteStudentAbilityArchive: (id: string) => void
  updateStudentAbilityPortrait: (id: string, data: Partial<StudentAbilityPortrait>) => void
  updateCreditConversionRules: (rules: CreditConversionRule[]) => void
  updatePortraitUpdateConfig: (config: Partial<PortraitUpdateConfig>) => void

  // 微证书管理
  certTypes: CertType[]
  updateCertTypes: (types: CertType[]) => void
  microCertTemplates: MicroCertTemplate[]
  createMicroCertTemplate: (data: MicroCertTemplateFormData) => MicroCertTemplate
  updateMicroCertTemplate: (id: string, data: MicroCertTemplateFormData) => void
  deleteMicroCertTemplate: (id: string) => void
  certIssuanceRecords: CertIssuanceRecord[]
  issueCert: (data: Omit<CertIssuanceRecord, 'id' | 'certNumber' | 'status'>) => CertIssuanceRecord
  issueBatchCerts: (records: Omit<CertIssuanceRecord, 'id' | 'certNumber' | 'status'>[]) => CertIssuanceRecord[]
  revokeCert: (id: string, reason: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(mockQuestionBanks)
  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [exams, setExams] = useState<Exam[]>(mockExams)

  // 场景任务测评状态
  const [evaluationCategories] = useState<EvaluationMethodCategory[]>(mockEvaluationCategories)
  const [evaluationMethods, setEvaluationMethods] = useState<EvaluationMethod[]>(mockEvaluationMethods)
  const [sceneTasks] = useState<SceneTask[]>(mockSceneTasks)
  const [sceneEvaluationResults] = useState<SceneEvaluationResult[]>(mockSceneEvaluationResults)
  const [jobAbilityResults] = useState<JobAbilityResult[]>(mockJobAbilityResults)
  const [positionsListState] = useState<Position[]>(positionsList)
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>(mockApprovalItems)

  // 场景任务评价状态
  const [sceneGradingStudentsState] = useState<SceneGradingStudent[]>(sceneGradingStudents)
  const [sceneGradingScenariosState] = useState<SceneGradingScenario[]>(sceneGradingScenarios)
  const [sceneGradingSubmissionsState] = useState<SceneGradingSubmission[]>(sceneGradingSubmissions)

  // 在线课堂评价状态
  const [onlineClassroomsState] = useState<OnlineClassroom[]>(mockOnlineClassrooms)

  // 智慧课程评价状态
  const [smartCoursesState] = useState<SmartCourse[]>(mockSmartCourses)

  // 毕业设计管理状态
  const [graduationProjectTopics, setGraduationProjectTopics] = useState<GraduationProjectTopic[]>(mockGraduationProjectTopics)
  const [graduationProjectArchives, setGraduationProjectArchives] = useState<GraduationProjectArchive[]>(mockGraduationProjectArchives)
  const [graduationProjectEvaluations, setGraduationProjectEvaluations] = useState<GraduationProjectEvaluation[]>(mockGraduationProjectEvaluations)
  const [graduationQueryResults] = useState<GraduationQueryResult[]>(mockGraduationQueryResults)
  const [processEvaluations, setProcessEvaluations] = useState<ProcessEvaluation[]>(mockProcessEvaluations)
  const [rectificationDetails, setRectificationDetails] = useState<RectificationDetail[]>(mockRectificationDetails)
  const [appealRecords, setAppealRecords] = useState<AppealRecord[]>(mockAppealRecords)
  const [evaluationStandards, setEvaluationStandards] = useState<EvaluationStandard[]>(mockEvaluationStandards)
  const [topicApplications, setTopicApplications] = useState<TopicApplication[]>(mockTopicApplications)

  // 学生能力画像管理状态
  const [studentAbilityArchives, setStudentAbilityArchives] = useState<StudentAbilityArchive[]>(mockStudentAbilityArchives)
  const [studentAbilityPortraits, setStudentAbilityPortraits] = useState<StudentAbilityPortrait[]>(mockStudentAbilityPortraits)
  const [creditConversionRules, setCreditConversionRules] = useState<CreditConversionRule[]>(mockCreditConversionRules)
  const [archiveVersions] = useState<ArchiveVersion[]>(mockArchiveVersions)
  const [portraitUpdateConfig, setPortraitUpdateConfig] = useState<PortraitUpdateConfig>({
    updateCycle: 'daily',
    queryLimit: 10,
    queryTimeStart: '08:00',
    queryTimeEnd: '22:00',
  })

  // 微证书管理状态
  const [certTypes, setCertTypes] = useState<CertType[]>(mockCertTypes)
  const [microCertTemplates, setMicroCertTemplates] = useState<MicroCertTemplate[]>(mockMicroCertTemplates)
  const [certIssuanceRecords, setCertIssuanceRecords] = useState<CertIssuanceRecord[]>(mockCertIssuanceRecords)

  const approveItem = useCallback((id: string, remark?: string) => {
    setApprovalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'approved' as const, remark } : item
      )
    )
  }, [])

  const rejectItem = useCallback((id: string, remark?: string) => {
    setApprovalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'rejected' as const, remark } : item
      )
    )
  }, [])

  // 题库操作
  const getQuestionBank = useCallback(
    (id: string) => questionBanks.find((bank) => bank.id === id),
    [questionBanks]
  )

  const createQuestionBank = useCallback((data: QuestionBankFormData): QuestionBank => {
    const newBank: QuestionBank = {
      id: `bank-${Date.now()}`,
      name: data.name,
      description: data.description,
      coverUrl: data.coverUrl,
      collaboratorIds: data.collaboratorIds,
      collaboratorDeptIds: data.collaboratorDeptIds,
      batchId: data.batchId,
      status: 'draft',
      questionCount: 0,
      version: 'v0.1.0',
      ownerType: 'mine',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setQuestionBanks((prev) => [...prev, newBank])
    return newBank
  }, [])

  const updateQuestionBank = useCallback((id: string, data: QuestionBankFormData) => {
    setQuestionBanks((prev) =>
      prev.map((bank) =>
        bank.id === id ? { ...bank, ...data, updatedAt: new Date() } : bank
      )
    )
  }, [])

  const deleteQuestionBank = useCallback((id: string) => {
    const bank = questionBanks.find((b) => b.id === id)
    if (bank?.isDraftPool) return
    setQuestionBanks((prev) => prev.filter((bank) => bank.id !== id))
    setQuestions((prev) => prev.filter((q) => q.bankId !== id))
  }, [questionBanks])

  const updateQuestionBankStatus = useCallback((id: string, action: StatusAction) => {
    setQuestionBanks((prev) =>
      prev.map((bank) => {
        if (bank.id !== id) return bank
        if (!canPerformAction(bank.status, action)) return bank
        return {
          ...bank,
          status: getNextStatus(action),
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  // 题目操作
  const getQuestionsByBank = useCallback(
    (bankId: string) => questions.filter((q) => q.bankId === bankId),
    [questions]
  )

  const getQuestion = useCallback(
    (id: string) => questions.find((q) => q.id === id),
    [questions]
  )

  const createQuestion = useCallback((bankId: string, data: QuestionFormData): Question => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      bankId,
      ...data,
      status: 'draft',
      createdAt: new Date(),
    }
    setQuestions((prev) => [...prev, newQuestion])
    // 更新题库题目数量
    setQuestionBanks((prev) =>
      prev.map((bank) =>
        bank.id === bankId
          ? { ...bank, questionCount: bank.questionCount + 1, updatedAt: new Date() }
          : bank
      )
    )
    return newQuestion
  }, [])

  const updateQuestion = useCallback((id: string, data: QuestionFormData) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q))
    )
  }, [])

  const updateQuestionStatus = useCallback((id: string, action: StatusAction) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        if (!canPerformAction(q.status, action)) return q
        return { ...q, status: getNextStatus(action) }
      })
    )
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    const question = questions.find((q) => q.id === id)
    if (question) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      setQuestionBanks((prev) =>
        prev.map((bank) =>
          bank.id === question.bankId
            ? { ...bank, questionCount: Math.max(0, bank.questionCount - 1), updatedAt: new Date() }
            : bank
        )
      )
    }
  }, [questions])

  const moveQuestions = useCallback((questionIds: string[], targetBankId: string) => {
    const targetBank = questionBanks.find((b) => b.id === targetBankId)
    if (!targetBank) return
    
    const movedQuestions = questions.filter((q) => questionIds.includes(q.id))
    const sourceBankIds = new Set(movedQuestions.map((q) => q.bankId))
    
    setQuestions((prev) =>
      prev.map((q) => (questionIds.includes(q.id) ? { ...q, bankId: targetBankId } : q))
    )
    
    setQuestionBanks((prev) =>
      prev.map((bank) => {
        if (bank.id === targetBankId) {
          return { ...bank, questionCount: bank.questionCount + movedQuestions.length, updatedAt: new Date() }
        }
        if (sourceBankIds.has(bank.id)) {
          const count = movedQuestions.filter((q) => q.bankId === bank.id).length
          return { ...bank, questionCount: Math.max(0, bank.questionCount - count), updatedAt: new Date() }
        }
        return bank
      })
    )
  }, [questions, questionBanks])

  // 试卷操作
  const getExam = useCallback(
    (id: string) => exams.find((exam) => exam.id === id),
    [exams]
  )

  const createExam = useCallback((data: ExamFormData): Exam => {
    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      name: data.name,
      description: data.description,
      duration: data.duration,
      coverUrl: data.coverUrl,
      collaboratorIds: data.collaboratorIds,
      collaboratorDeptIds: data.collaboratorDeptIds,
      batchId: data.batchId,
      status: 'draft',
      totalScore: 0,
      questions: [],
      version: 'v0.1.0',
      ownerType: 'mine',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setExams((prev) => [...prev, newExam])
    return newExam
  }, [])

  const updateExam = useCallback((id: string, data: Partial<Exam>) => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === id ? { ...exam, ...data, updatedAt: new Date() } : exam
      )
    )
  }, [])

  const deleteExam = useCallback((id: string) => {
    setExams((prev) => prev.filter((exam) => exam.id !== id))
  }, [])

  const updateExamStatus = useCallback((id: string, action: StatusAction) => {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== id) return exam
        if (!canPerformAction(exam.status, action)) return exam
        return {
          ...exam,
          status: getNextStatus(action),
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const addQuestionToExam = useCallback((examId: string, question: Question, score?: number) => {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== examId) return exam
        // 检查是否已存在
        if (exam.questions.some((q) => q.questionId === question.id)) return exam

        const examQuestion: ExamQuestion = {
          id: `eq-${Date.now()}`,
          questionId: question.id,
          type: question.type,
          content: question.content,
          options: question.options,
          answer: question.answer,
          analysis: question.analysis,
          score: score ?? question.score,
          order: exam.questions.length + 1,
        }

        const newQuestions = [...exam.questions, examQuestion]
        const totalScore = newQuestions.reduce((sum, q) => sum + q.score, 0)

        return {
          ...exam,
          questions: newQuestions,
          totalScore,
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const removeQuestionFromExam = useCallback((examId: string, examQuestionId: string) => {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== examId) return exam

        const newQuestions = exam.questions
          .filter((q) => q.id !== examQuestionId)
          .map((q, index) => ({ ...q, order: index + 1 }))
        const totalScore = newQuestions.reduce((sum, q) => sum + q.score, 0)

        return {
          ...exam,
          questions: newQuestions,
          totalScore,
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  const updateExamQuestionScore = useCallback(
    (examId: string, examQuestionId: string, score: number) => {
      setExams((prev) =>
        prev.map((exam) => {
          if (exam.id !== examId) return exam

          const newQuestions = exam.questions.map((q) =>
            q.id === examQuestionId ? { ...q, score } : q
          )
          const totalScore = newQuestions.reduce((sum, q) => sum + q.score, 0)

          return {
            ...exam,
            questions: newQuestions,
            totalScore,
            updatedAt: new Date(),
          }
        })
      )
    },
    []
  )

  const reorderExamQuestions = useCallback((examId: string, questions: ExamQuestion[]) => {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== examId) return exam
        return {
          ...exam,
          questions: questions.map((q, index) => ({ ...q, order: index + 1 })),
          updatedAt: new Date(),
        }
      })
    )
  }, [])

  // 场景任务测评操作
  const updateEvaluationMethod = useCallback((id: string, data: Partial<EvaluationMethod>) => {
    setEvaluationMethods((prev) =>
      prev.map((method) => (method.id === id ? { ...method, ...data } : method))
    )
  }, [])

  const getSceneTasksByMethod = useCallback(
    (methodId: string) => sceneTasks.filter((task) => task.methodIds.includes(methodId)),
    [sceneTasks]
  )

  const getResultsByMethod = useCallback(
    (methodId: string) => sceneEvaluationResults.filter((res) => res.methodId === methodId),
    [sceneEvaluationResults]
  )

  const value: DataContextValue = {
    questionBanks,
    getQuestionBank,
    createQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    updateQuestionBankStatus,
    questions,
    getQuestionsByBank,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    updateQuestionStatus,
    moveQuestions,
    exams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    updateExamStatus,
    addQuestionToExam,
    removeQuestionFromExam,
    updateExamQuestionScore,
    reorderExamQuestions,
    evaluationCategories,
    evaluationMethods,
    sceneTasks,
    sceneEvaluationResults,
    updateEvaluationMethod,
    getSceneTasksByMethod,
    getResultsByMethod,
    sceneGradingStudents: sceneGradingStudentsState,
    sceneGradingScenarios: sceneGradingScenariosState,
    sceneGradingSubmissions: sceneGradingSubmissionsState,
    onlineClassrooms: onlineClassroomsState,
    smartCourses: smartCoursesState,
    jobAbilityResults,
    positionsList: positionsListState,
    getPositionAbilityItems: (positionId: string) => positionAbilityItemsMap[positionId] || abilityItems,
    approvalItems,
    approveItem,
    rejectItem,
    graduationProjectTopics,
    graduationProjectArchives,
    graduationProjectEvaluations,
    graduationQueryResults,
    // 毕业设计管理操作
    createGraduationProjectTopic: (data: any) => {
      const newTopic: GraduationProjectTopic = {
        id: `gp-topic-${Date.now()}`,
        name: data.name,
        positionId: data.positionId || 'pos-1',
        positionName: data.positionName || '全栈开发工程师',
        college: data.college || '计算机学院',
        source: data.source || 'enterprise',
        status: 'published',
        capacity: Number(data.capacity) || 1,
        appliedCount: 0,
        advisorName: data.advisorName,
        enterpriseMentorName: data.enterpriseMentorName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description,
        createdAt: new Date(),
      }
      setGraduationProjectTopics((prev) => [...prev, newTopic])
      return newTopic
    },
    updateGraduationProjectTopic: (id: string, data: any) => {
      setGraduationProjectTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      )
    },
    deleteGraduationProjectTopic: (id: string) => {
      setGraduationProjectTopics((prev) => prev.filter((t) => t.id !== id))
    },
    updateGraduationProjectArchive: (id: string, data: Partial<GraduationProjectArchive>) => {
      setGraduationProjectArchives((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      )
    },
    updateGraduationProjectEvaluation: (id: string, data: Partial<GraduationProjectEvaluation>) => {
      setGraduationProjectEvaluations((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data, status: 'completed' as const } : e))
      )
    },

    // 学生能力画像管理操作
    createStudentAbilityArchive: (data: any) => {
      const newArchive: StudentAbilityArchive = {
        id: `sp-arch-${Date.now()}`,
        studentName: data.studentName,
        studentId: data.studentId,
        className: data.className,
        materialType: data.materialType,
        materialName: data.materialName,
        issuingOrg: data.issuingOrg,
        obtainDate: new Date(data.obtainDate),
        auditStatus: 'pending',
        convertedCredit: 0,
        direction: data.direction || 'positive',
        isVisible: true,
        createdAt: new Date(),
      }
      setStudentAbilityArchives((prev) => [...prev, newArchive])
      return newArchive
    },
    updateStudentAbilityArchive: (id: string, data: Partial<StudentAbilityArchive>) => {
      setStudentAbilityArchives((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      )
    },
    deleteStudentAbilityArchive: (id: string) => {
      setStudentAbilityArchives((prev) => prev.filter((a) => a.id !== id))
    },
    updateStudentAbilityPortrait: (id: string, data: Partial<StudentAbilityPortrait>) => {
      setStudentAbilityPortraits((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p))
      )
    },
    updateCreditConversionRules: (rules: CreditConversionRule[]) => {
      setCreditConversionRules(rules)
    },
    updatePortraitUpdateConfig: (config: Partial<PortraitUpdateConfig>) => {
      setPortraitUpdateConfig((prev) => ({ ...prev, ...config }))
    },

    // 扩展演示数据
    processEvaluations,
    rectificationDetails,
    appealRecords,
    evaluationStandards,
    topicApplications,
    createTopicApplication: (data: any) => {
      const newApp: TopicApplication = {
        id: `app-${Date.now()}`,
        topicId: data.topicId,
        topicName: data.topicName,
        studentId: data.studentId,
        studentName: data.studentName,
        className: data.className,
        status: data.status || 'pending',
        applyReason: data.applyReason,
        appliedAt: new Date(),
        allocatedAdvisorId: data.allocatedAdvisorId,
        allocatedAdvisorName: data.allocatedAdvisorName,
      }
      setTopicApplications((prev) => [...prev, newApp])
      return newApp
    },
    updateTopicApplication: (id: string, data: Partial<TopicApplication>) => {
      setTopicApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      )
    },
    createProcessEvaluation: (data: any) => {
      const newEval: ProcessEvaluation = {
        id: `pe-${Date.now()}`,
        archiveId: data.archiveId,
        studentName: data.studentName,
        topicName: data.topicName,
        phase: data.phase,
        advisorScore: data.advisorScore,
        comment: data.comment,
        evaluatedAt: new Date(),
      }
      setProcessEvaluations((prev) => [...prev, newEval])
      return newEval
    },
    createRectificationDetail: (data: any) => {
      const newRect: RectificationDetail = {
        id: `rect-${Date.now()}`,
        archiveId: data.archiveId,
        studentName: data.studentName,
        topicName: data.topicName,
        requirement: data.requirement,
        deadline: new Date(data.deadline),
        status: 'pending',
        studentResponse: data.studentResponse,
        submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
      }
      setRectificationDetails((prev) => [...prev, newRect])
      return newRect
    },
    updateRectificationDetail: (id: string, data: Partial<RectificationDetail>) => {
      setRectificationDetails((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      )
    },
    createAppealRecord: (data: any) => {
      const newAppeal: AppealRecord = {
        id: `appeal-${Date.now()}`,
        studentId: data.studentId,
        studentName: data.studentName,
        type: data.type,
        reason: data.reason,
        status: 'pending',
        createdAt: new Date(),
      }
      setAppealRecords((prev) => [...prev, newAppeal])
      return newAppeal
    },
    updateAppealRecord: (id: string, data: Partial<AppealRecord>) => {
      setAppealRecords((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      )
    },
    updateEvaluationStandard: (id: string, data: Partial<EvaluationStandard>) => {
      setEvaluationStandards((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      )
    },

    // 微证书管理
    certTypes,
    updateCertTypes: (types: CertType[]) => {
      setCertTypes(types)
    },
    microCertTemplates,
    createMicroCertTemplate: (data: MicroCertTemplateFormData) => {
      const certTypeName = certTypes.find((t) => t.id === data.certTypeId)?.name || '未知'
      const newTemplate: MicroCertTemplate = {
        id: `mct-${Date.now()}`,
        title: data.title,
        certTypeId: data.certTypeId,
        certTypeName,
        content: data.content,
        coverUrl: data.coverUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setMicroCertTemplates((prev) => [...prev, newTemplate])
      return newTemplate
    },
    updateMicroCertTemplate: (id: string, data: MicroCertTemplateFormData) => {
      const certTypeName = certTypes.find((t) => t.id === data.certTypeId)?.name || '未知'
      setMicroCertTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...data, certTypeName, updatedAt: new Date() } : t
        )
      )
    },
    deleteMicroCertTemplate: (id: string) => {
      setMicroCertTemplates((prev) => prev.filter((t) => t.id !== id))
    },
    certIssuanceRecords,
    issueCert: (data) => {
      let counter = 100 + certIssuanceRecords.length
      const newRecord: CertIssuanceRecord = {
        id: `cir-${Date.now()}`,
        ...data,
        certNumber: `MC-2024-${String(counter).padStart(5, '0')}`,
        status: 'issued',
      }
      setCertIssuanceRecords((prev) => [...prev, newRecord])
      return newRecord
    },
    issueBatchCerts: (records) => {
      let counter = 100 + certIssuanceRecords.length
      const newRecords = records.map((data) => {
        counter++
        return {
          id: `cir-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...data,
          certNumber: `MC-2024-${String(counter).padStart(5, '0')}`,
          status: 'issued' as const,
        }
      })
      setCertIssuanceRecords((prev) => [...prev, ...newRecords])
      return newRecords
    },
    revokeCert: (id: string, reason: string) => {
      setCertIssuanceRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'revoked' as const, revokedAt: new Date(), revokeReason: reason }
            : r
        )
      )
    },

    creditConversionRules,
    archiveVersions,
    portraitUpdateConfig,
    studentAbilityArchives,
    studentAbilityPortraits,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
