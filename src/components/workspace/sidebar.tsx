'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PanelLeft, PanelRight, Plus } from 'lucide-react'
import { UserMenu } from './user-menu'
import { PageTree } from './page-tree'
import { usePageMutations } from '@/hooks/use-page-mutations'

interface SidebarProps {
  userName: string
  userImage?: string | null
}

export function Sidebar({ userName, userImage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { createPage } = usePageMutations()

  return (
    <>
      <aside
        className={`relative flex flex-col bg-sidebar transition-all duration-200 ${
          collapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        {/* Top: Brand */}
        <div className="flex h-12 items-center px-4">
          <span className="text-sm font-semibold">Notely</span>
        </div>

        <Separator />

        {/* Middle: Pages section */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 text-sm font-semibold text-muted-foreground">Pages</p>
          <PageTree />
        </div>

        <Separator />

        {/* New Page CTA */}
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => createPage.mutate({})}
          >
            <Plus className="h-4 w-4" />
            New Page
          </Button>
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
