'use client'
import { Sidebar } from './sidebar'

interface WorkspaceLayoutProps {
  userName: string
  userImage?: string | null
  children: React.ReactNode
}

export function WorkspaceLayout({ userName, userImage, children }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={userName} userImage={userImage} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
