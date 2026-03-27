'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'
import { useWorkspace } from './workspace-layout'
import { CreateOrgDialog } from './create-org-dialog'

interface Org {
  id: string
  name: string
  slug: string
}

interface OrgSwitcherProps {
  currentOrgName: string
  orgs: Org[]
}

export function OrgSwitcher({ currentOrgName, orgs }: OrgSwitcherProps) {
  const router = useRouter()
  const { organizationId } = useWorkspace()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  async function switchOrg(orgId: string, orgSlug: string) {
    setPopoverOpen(false)
    await authClient.organization.setActive({ organizationId: orgId })
    router.push(`/${orgSlug}`)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-12 w-full items-center justify-between px-4"
            aria-label="Switch organization"
            aria-expanded={popoverOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold truncate">{currentOrgName}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <p className="px-2 py-1 text-xs text-muted-foreground">Your organizations</p>
          {orgs.map((org) => (
            <button
              key={org.id}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 cursor-pointer hover:bg-muted"
              role="option"
              aria-selected={org.id === organizationId}
              onClick={() => switchOrg(org.id, org.slug)}
            >
              <Building2 className="h-6 w-6 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold truncate">{org.name}</span>
              {org.id === organizationId && <Check className="ml-auto h-4 w-4 text-primary" />}
            </button>
          ))}
          <Separator className="my-1" />
          <button
            className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 cursor-pointer hover:bg-muted"
            onClick={() => {
              setPopoverOpen(false)
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Create organization</span>
          </button>
        </PopoverContent>
      </Popover>

      <CreateOrgDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  )
}
