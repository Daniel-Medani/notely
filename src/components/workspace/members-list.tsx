'use client'

import { useState, useOptimistic } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { removeMemberAction, updateMemberRoleAction } from '@/lib/actions/org-actions'

interface Member {
  id: string
  role: string
  userId: string
  user: { id: string; name: string; email: string; image?: string | null }
}

interface MembersListProps {
  members: Member[]
  organizationId: string
  organizationName: string
  currentUserId: string
  isAdmin: boolean
}

export function MembersList({
  members,
  organizationId,
  organizationName,
  currentUserId,
  isAdmin,
}: MembersListProps) {
  const [optimisticMembers, applyOptimistic] = useOptimistic(members)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'member') {
    applyOptimistic((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    )
    const result = await updateMemberRoleAction({ organizationId, memberId, role: newRole })
    if (result.success) {
      toast.success(`Role updated to ${newRole === 'admin' ? 'Admin' : 'Member'}.`)
    } else {
      // Revert by re-applying original value — optimistic state reverts on next render
      toast.error('Failed to update role. Try again.')
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return
    const target = removeTarget
    setRemoveTarget(null)
    applyOptimistic((prev) => prev.filter((m) => m.id !== target.id))
    const result = await removeMemberAction({ organizationId, memberId: target.id })
    if (result.success) {
      toast.success('Member removed.')
    } else {
      toast.error('Failed to remove member. Try again.')
    }
  }

  if (optimisticMembers.length === 0) {
    return <p className="text-sm text-muted-foreground">No members yet.</p>
  }

  return (
    <>
      <div className="space-y-1">
        {optimisticMembers.map((member) => {
          const isOwnerOrAdmin = member.role === 'admin' || member.role === 'owner'
          const displayRole = isOwnerOrAdmin ? 'Admin' : 'Member'

          return (
            <div
              key={member.id}
              className="flex min-h-[44px] items-center justify-between gap-4 rounded-md px-2 py-1"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={isOwnerOrAdmin ? 'default' : 'secondary'}
                  aria-label={`Role: ${displayRole}`}
                >
                  {displayRole}
                </Badge>

                {isAdmin && member.userId !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Member actions for ${member.user.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(
                            member.id,
                            isOwnerOrAdmin ? 'member' : 'admin',
                          )
                        }
                      >
                        {isOwnerOrAdmin ? 'Change role to Member' : 'Change role to Admin'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setRemoveTarget(member)}
                      >
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeTarget?.user.name} from {organizationName}? They will lose access to
              all pages immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveConfirm}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
