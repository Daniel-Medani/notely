'use client'

import { createContext, useContext } from 'react'
import { Sidebar } from './sidebar'

interface WorkspaceContextValue {
  organizationId: string
  orgSlug: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceLayout')
  return ctx
}

interface WorkspaceLayoutProps {
  userName: string
  userImage?: string | null
  organizationId: string
  orgSlug: string
  children: React.ReactNode
}

export function WorkspaceLayout({ userName, userImage, organizationId, orgSlug, children }: WorkspaceLayoutProps) {
  return (
    <WorkspaceContext.Provider value={{ organizationId, orgSlug }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userName={userName} userImage={userImage} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </WorkspaceContext.Provider>
  )
}
