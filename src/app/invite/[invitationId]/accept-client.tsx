'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { acceptInvitationAction } from '@/lib/actions/org-actions'
import { Button } from '@/components/ui/button'

interface AcceptInvitationClientProps {
  invitationId: string
  orgName: string
  orgSlug: string
}

export function AcceptInvitationClient({
  invitationId,
  orgName: _orgName,
  orgSlug,
}: AcceptInvitationClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await acceptInvitationAction(invitationId)

      if (!result.success) {
        setError(result.error ?? 'Failed to accept invitation. Please try again.')
        return
      }

      router.push(`/${orgSlug}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleAccept}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Accepting...' : 'Accept Invitation'}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </>
  )
}
