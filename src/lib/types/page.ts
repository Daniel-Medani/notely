export interface PageFlat {
  id: string
  title: string
  emoji: string | null
  parentId: string | null
  order: number
  isDeleted: boolean
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface PageNode {
  id: string
  title: string
  emoji: string | null
  parentId: string | null
  order: number
  children: PageNode[]
}
