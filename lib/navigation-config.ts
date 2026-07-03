import type { PlatformNavigationConfig } from "@/components/platform-shell"

export const evaluationNavigationConfig: PlatformNavigationConfig = {
  brandTitle: "能力评价与测评资源管理平台",
  currentPlatformId: "evaluation",
  currentPlatformLabel: "能力评价与测评资源管理平台",
  brandHref: "/",
  brandIcon: "settings",
  platformIcon: "settings",
  sideBackHref: "/",
  currentUserName: "管理员",
  currentUserRoleLabel: "能力评价与测评资源管理平台",
  showCurrentTime: true,
  userMenuItems: [
    { id: "profile", label: "个人中心", icon: "user" },
    { id: "account", label: "账号设置", icon: "settings" },
    { id: "logout", label: "退出登录", tone: "danger" },
  ],
  topNavItems: [
    { id: "portal", label: "门户首页", href: "http://111.170.170.202:3001/portal", icon: "home" },
    { id: "workspace", label: "我的服务台", href: "http://111.170.170.202:3001/portal/workspace", icon: "briefcase" },
    { id: "apps", label: "应用服务中心", href: "http://111.170.170.202:3001/portal/apps", icon: "layoutGrid" },
  ],
  sideNavItems: [
    {
      id: "general-evaluation",
      label: "通用测评资源管理",
      icon: "folderKanban",
      children: [
        { id: "question-banks", label: "题库管理", href: "/question-banks", matchers: ["/question-banks"] },
        { id: "exams", label: "试卷管理", href: "/exams", matchers: ["/exams"] },
        { id: "exam-usage", label: "考试管理", href: "/exam-usage", matchers: ["/exam-usage$", "/exam-usage/results"] },
        { id: "approval-center", label: "审批中心", href: "/approval-center", matchers: ["/approval-center"] },
      ],
    },
    {
      id: "job-ability",
      label: "岗位能力认定管理",
      icon: "briefcase",
      children: [
        { id: "job-ability-rules", label: "岗位能力认定规则配置", href: "/job-ability", matchers: ["/job-ability$"] },
        { id: "job-ability-results", label: "岗位能力认定结果查看", href: "/job-ability/results", matchers: ["/job-ability/results"] },
      ],
    },
    {
      id: "scene-task",
      label: "测评方式库",
      icon: "layers3",
      children: [
        { id: "scene-task-methods", label: "测评方式管理", href: "/evaluation-methods", matchers: ["/evaluation-methods"] },
        { id: "scene-task-results", label: "测评结果管理", href: "/scene-task-results", matchers: ["/scene-task-results"] },
      ],
    },
    {
      id: "graduation-project",
      label: "毕业设计管理",
      icon: "graduationCap",
      children: [
        { id: "gp-topics", label: "毕业设计选题管理", href: "/graduation-project/topics", matchers: ["/graduation-project/topics"] },
        { id: "gp-archives", label: "毕设档案管理", href: "/graduation-project/archives", matchers: ["/graduation-project/archives"] },
        { id: "gp-evaluation", label: "毕设评价管理", href: "/graduation-project/evaluation", matchers: ["/graduation-project/evaluation"] },
        { id: "gp-query", label: "毕业查询管理", href: "/graduation-project/query", matchers: ["/graduation-project/query"] },
      ],
    },
    {
      id: "student-portrait",
      label: "学生画像管理",
      icon: "userCircle",
      children: [
        // { id: "sp-archives", label: "学生档案管理", href: "/student-portrait/archives", matchers: ["/student-portrait/archives"] },
        { id: "sp-portraits", label: "学生画像管理", href: "/student-portrait/portraits", matchers: ["/student-portrait/portraits"] },
      ],
    },
  ],
}
