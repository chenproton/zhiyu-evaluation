import type { Metadata } from 'next'
import { Suspense } from 'react'
// import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DataProvider } from '@/components/providers/data-provider'
import ShellWrapper from './shell-wrapper'
import { AnnotationClient } from '@/components/annotation-client'
import { AnnotationEditProvider } from '@/lib/annotation-edit-context'
import { FloatingAnnotations } from '@/components/floating-annotations'
import { AnnotationEditToolbar } from '@/components/annotation-edit-toolbar'
import './globals.css'

// const geist = Geist({ subsets: ["latin"] })
// const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: '能力评价与测评资源管理平台',
  description: '题库、组卷、试卷、岗位能力认证、毕业设计、学生能力画像管理系统',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        <DataProvider>
          <AnnotationEditProvider>
            <Suspense fallback={
              <div className="flex min-h-screen bg-[#f5f7fa] pt-14">
                <main className="min-w-0 flex-1 p-6">{children}</main>
              </div>
            }>
              <ShellWrapper>{children}</ShellWrapper>
            </Suspense>
            <FloatingAnnotations />
            <AnnotationEditToolbar />
          </AnnotationEditProvider>
        </DataProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <AnnotationClient />
      </body>
    </html>
  )
}
