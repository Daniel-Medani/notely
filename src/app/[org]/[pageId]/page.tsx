import { PageHeader } from '@/components/page/page-header'

export default async function PageView({
  params,
}: {
  params: Promise<{ org: string; pageId: string }>
}) {
  const { pageId } = await params

  return (
    <div className="h-full">
      <PageHeader pageId={pageId} />
      {/* Phase 3 will add the TipTap editor here */}
      <div className="px-16 py-8">
        <p className="text-sm text-muted-foreground">
          Editor content will appear here in Phase 3.
        </p>
      </div>
    </div>
  )
}
