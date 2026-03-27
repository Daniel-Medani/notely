import { PageHeader } from '@/components/page/page-header'
import { BlockEditor } from '@/components/editor/block-editor'
import { PageService } from '@/services/page-service'
import { PrismaPageRepository } from '@/repositories/prisma/prisma-page-repository'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { JSONContent } from '@tiptap/core'

const pageService = new PageService(new PrismaPageRepository())

export default async function PageView({
  params,
}: {
  params: Promise<{ org: string; pageId: string }>
}) {
  const { org, pageId } = await params

  // Resolve organizationId from slug (same pattern as [org]/layout.tsx)
  const organization = await prisma.organization.findFirst({
    where: { slug: org },
  })
  if (!organization) notFound()

  // Fetch page content server-side using PageService.findById (added in Plan 03-01 Task 2)
  const page = await pageService.findById(pageId, organization.id)

  return (
    <div className="h-full">
      <PageHeader pageId={pageId} />
      {page ? (
        <BlockEditor pageId={pageId} initialContent={(page.content as JSONContent) ?? null} />
      ) : (
        <div className="px-16 py-8">
          <p className="text-sm text-muted-foreground">This page could not be loaded.</p>
        </div>
      )}
    </div>
  )
}
