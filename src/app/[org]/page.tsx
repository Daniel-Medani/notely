import { verifySession } from '@/lib/dal'
import { WorkspaceLayout } from '@/components/workspace/workspace-layout'
import { Button } from '@/components/ui/button'

export default async function WorkspacePage() {
  const session = await verifySession()

  return (
    <WorkspaceLayout
      userName={session.user.name}
      userImage={session.user.image}
    >
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Welcome to Notely</h1>
        <p className="text-sm text-muted-foreground">
          Create your first page to get started.
        </p>
        <Button className="mt-2">New Page</Button>
      </div>
    </WorkspaceLayout>
  )
}
