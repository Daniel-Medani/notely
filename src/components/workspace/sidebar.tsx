'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeft, PanelRight } from 'lucide-react'
import { UserMenu } from './user-menu'

interface SidebarProps {
  userName: string
  userImage?: string | null
}

export function Sidebar({ userName, userImage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <aside
        className={`relative flex flex-col bg-card transition-all duration-200 ${
          collapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        {/* Top: Brand */}
        <div className="flex h-12 items-center px-4">
          <span className="text-sm font-semibold">Notely</span>
        </div>

        {/* Middle: Pages section */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <p className="text-sm font-semibold text-muted-foreground">Pages</p>
          <p className="mt-2 text-sm text-muted-foreground">No pages yet.</p>
        </div>

        {/* Bottom: User menu */}
        <UserMenu userName={userName} userImage={userImage} />
      </aside>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-1/2 z-10 h-11 w-11 -translate-y-1/2"
        style={{ left: collapsed ? '0px' : '240px' }}
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </Button>
    </>
  )
}
