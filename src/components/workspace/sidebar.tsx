'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PanelLeft, PanelRight, Plus, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { UserMenu } from './user-menu'
import { PageTree } from './page-tree'
import { usePageMutations } from '@/hooks/use-page-mutations'
import { SearchPalette } from './search-palette'
import { OrgSwitcher } from './org-switcher'
import { useWorkspace } from './workspace-layout'

interface SidebarProps {
  userName: string
  userImage?: string | null
  orgName: string
  orgs: Array<{ id: string; name: string; slug: string }>
}

export function Sidebar({ userName, userImage, orgName, orgs }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { createPage } = usePageMutations()
  const { orgSlug } = useWorkspace()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <aside
        className={`relative flex flex-col bg-sidebar transition-all duration-200 ${
          collapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        {/* Top: Org Switcher */}
        <OrgSwitcher currentOrgName={orgName} orgs={orgs} />

        {/* Search button */}
        <div className="px-2 py-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Cmd+K</kbd>
          </Button>
        </div>

        <Separator />

        {/* Middle: Pages section */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 text-sm font-semibold text-muted-foreground">Pages</p>
          <PageTree />
        </div>

        <Separator />

        {/* Bottom actions */}
        <div className="px-2 py-2 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => createPage.mutate({})}
          >
            <Plus className="h-4 w-4" />
            New Page
          </Button>
          <Link href={`/${orgSlug}/settings/members`}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
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

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
