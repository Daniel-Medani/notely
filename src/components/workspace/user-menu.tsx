'use client'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface UserMenuProps {
  userName: string
  userImage?: string | null
}

export function UserMenu({ userName, userImage }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-between border-t px-4 h-12">
      <div className="flex items-center gap-2 min-w-0">
        {userImage ? (
          <img src={userImage} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="truncate text-sm">{userName}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="text-muted-foreground"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sign out
      </Button>
    </div>
  )
}
