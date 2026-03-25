import { Button } from '@/components/ui/button'

export default function WorkspacePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Create your first page</h1>
      <p className="text-sm text-muted-foreground">
        Use the button below or press N to add your first page.
      </p>
      <Button className="mt-2">New Page</Button>
    </div>
  )
}
