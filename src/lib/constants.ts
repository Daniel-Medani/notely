export const PAGES_QUERY_KEY = (orgId: string) => ['pages', orgId] as const
export const ORGS_QUERY_KEY = () => ['organizations'] as const
export const MEMBERS_QUERY_KEY = (orgId: string) => ['members', orgId] as const
