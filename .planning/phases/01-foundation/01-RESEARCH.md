# Phase 1: Foundation - Research

**Researched:** 2026-03-25
**Domain:** Authentication (Better Auth), Next.js 16 proxy.ts, Prisma 7 + Neon, tenant isolation patterns, CI/CD setup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth page design:**
- D-01: Separate pages for sign-in (`/login`) and sign-up (`/register`) with cross-links between them
- D-02: Centered card layout on a clean background — no split panel or full-page form
- D-03: Google OAuth button appears above the email/password form with an "or" divider
- D-04: Branding is app name text ("Notely") only — no icon or tagline for v1

**Sign-up flow:**
- D-05: No email verification for v1 — instant access after signup
- D-06: Sign-up form fields: email, password, confirm password, and display name (4 fields)
- D-07: Password requirement: minimum 8 characters, no complexity rules
- D-08: Personal organization auto-created on signup, named "{User's name}'s Workspace"

**Post-auth landing:**
- D-09: After sign-in, users land in the workspace with sidebar + main content area
- D-10: Empty workspace shows a welcome message ("Welcome to Notely") with a "New Page" CTA button in the main area
- D-11: Sidebar is collapsible via toggle button
- D-12: Sidebar contains: Notely logo at top, "Pages" section header with empty state, user avatar/menu at bottom for sign-out

**Error & feedback UX:**
- D-13: Auth errors displayed inline below the relevant form field (red text)
- D-14: Loading state: submit button shows spinner and becomes disabled during processing
- D-15: After successful sign-up, redirect straight to workspace — no welcome screen, toast, or interstitial

### Claude's Discretion
- Exact spacing, typography, and color choices within shadcn/ui defaults
- Loading skeleton design for initial page load
- Specific error message wording (e.g., "Invalid email or password" vs "Email not found")
- Sign-out confirmation behavior (direct sign-out vs confirm dialog)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | Better Auth emailAndPassword plugin + Zod schema + Server Action signup flow |
| AUTH-02 | User can sign in with email and password | Better Auth emailAndPassword plugin + authClient.signIn.email() |
| AUTH-03 | User can sign in with Google OAuth | Better Auth socialProviders.google config + Google Cloud Console credentials |
| AUTH-04 | User session persists across browser refresh | Better Auth cookie-based session (compact encoding by default, 7-day expiry) |
| AUTH-05 | Personal organization auto-created on signup with user as Admin | Better Auth databaseHooks.user.create.after — known issues documented; use direct Prisma insert as safest approach |
| AUTH-06 | Every route and API endpoint requires authentication (no public access) | proxy.ts optimistic redirect + DAL verifySession() in every Server Action/Server Component |
| TNNT-01 | Every database table includes an organizationId foreign key | Prisma schema design — all tables get `organizationId String` FK |
| TNNT-02 | All queries scoped to current organization | Repository interfaces enforce organizationId parameter pattern |
| TNNT-03 | Tenant resolved via path-based routing (`/[org]/...`) | Next.js App Router dynamic segment `[org]` — resolved in layouts |
| TNNT-04 | Repository interfaces require organizationId on all methods | IRepository contract design — enforced via TypeScript interface |
| SEC-01 | All user input validated server-side with Zod before touching DB | Zod 4.3.6 schemas in Server Actions — shared schema pattern |
| SEC-02 | All database queries go through Prisma (no raw SQL) | Prisma 7.5.0 typed methods only; `$queryRaw` template literal only if ever needed |
| SEC-04 | No secrets exposed in client bundles | Server-only env vars; no NEXT_PUBLIC_ for secrets |
| SEC-05 | Server Actions wrapped with auth and authorization checks | DAL verifySession() called at start of every Server Action |
| SEC-06 | API layer returns consistent error shapes without leaking stack traces | Centralized error handler returning `{ error: string, code: string }` shape |
| CICD-01 | GitHub Actions runs ESLint + Prettier check on every PR | `.github/workflows/ci.yml` lint-typecheck job |
| CICD-02 | GitHub Actions runs TypeScript type check on every PR | `tsc --noEmit` in same ci.yml job; Next.js 16 flat ESLint config ships by default |
</phase_requirements>

---

## Summary

Phase 1 establishes the authentication, tenant isolation, and CI infrastructure that every subsequent phase depends on. The technology is largely locked by CLAUDE.md: Better Auth 1.5.6 handles auth, Prisma 7.5.0 + Neon handles the database, and Next.js 16 uses `proxy.ts` (not `middleware.ts`) for optimistic route protection.

The most significant research finding is a well-documented pitfall around auto-creating organizations on signup via `databaseHooks.user.create.after`: calling `auth.api.createOrganization` from inside that hook can fail with permission errors when `allowUserToCreateOrganization` is configured, and there is a separate foreign-key-constraint issue during social login in some Better Auth versions. The safest implementation is to bypass the Better Auth org API entirely inside the hook and call Prisma directly — this avoids the permission check and is documented as the working community workaround.

The dual-layer route protection strategy (proxy.ts for optimistic redirect + `verifySession()` DAL check in every Server Action and Server Component) is the official Next.js 16 recommendation. Proxy alone is explicitly insufficient — Server Actions on a protected page path will still be invoked via POST without proxy coverage if a Server Function moves routes, so every action must verify independently.

**Primary recommendation:** Implement auth with Better Auth 1.5.6, protect routes with proxy.ts + DAL pattern, create the personal org via direct Prisma in `databaseHooks.user.create.after`, scaffold CI before writing application code.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack framework, App Router, Server Actions | Locked by CLAUDE.md; proxy.ts replaces middleware.ts in v16 |
| TypeScript | 5.x (via Next.js) | Type safety | Non-negotiable; enforced in CI via `tsc --noEmit` |
| Better Auth | 1.5.6 | Auth: email/password, Google OAuth, sessions, org primitives | Locked by CLAUDE.md; first-class Prisma adapter, org plugin built-in |
| Prisma | 7.5.0 | Database ORM, migrations | Locked by CLAUDE.md; Rust-free, works on Vercel serverless |
| `@prisma/adapter-neon` | 7.5.0 | Neon WebSocket adapter | Required — prevents connection exhaustion on Vercel serverless |
| `@neondatabase/serverless` | 1.0.2 | Neon WebSocket driver | Peer dep of adapter |
| Zod | 4.3.6 | Server-side input validation | Locked by CLAUDE.md; shared schema pattern (Server Action + RHF) |
| React Hook Form | 7.72.0 | Client-side form state | Used with `@hookform/resolvers` + Zod for sign-up and sign-in forms |
| `@hookform/resolvers` | 5.2.2 | Connects Zod to RHF | Required when using RHF + Zod |
| shadcn/ui | latest CLI | UI components (Card, Button, Input, Form, Label) | Locked by CLAUDE.md; Tailwind v4 + React 19 |
| Tailwind CSS | 4.x | Utility CSS | Locked by CLAUDE.md; zero config file, `@theme` in globals.css |
| lucide-react | 1.0.1 | Icons (spinner, chevron, etc.) | Default shadcn/ui icon library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` / `react-dom` | 19.x (via Next.js) | React 19 required for `useActionState` | `useActionState` drives form loading state (D-14) |
| `server-only` | latest | Prevent server modules from leaking to client | Mark DAL, auth instance, Prisma client as server-only |
| `next-themes` | latest | Dark mode (system-aware) | Phase 7 concern — wire provider in root layout now so it's available later |

**Installation:**
```bash
npm install better-auth @prisma/adapter-neon @neondatabase/serverless zod react-hook-form @hookform/resolvers lucide-react sonner next-themes
npx shadcn@latest init
npx shadcn@latest add button card input label form separator
```

**Version verification (confirmed 2026-03-25 via npm registry):**
- `better-auth`: 1.5.6 (published 2026-03-23)
- `@prisma/adapter-neon`: 7.5.0 (matches Prisma core)
- `@neondatabase/serverless`: 1.0.2
- `react-hook-form`: 7.72.0
- `@hookform/resolvers`: 5.2.2
- `zod`: 4.3.6
- `vitest`: 4.1.1
- `@playwright/test`: 1.58.2

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Route group — no layout inheritance
│   │   ├── login/page.tsx       # Sign-in page (D-01)
│   │   └── register/page.tsx    # Sign-up page (D-01)
│   ├── [org]/                   # Tenant segment (TNNT-03)
│   │   ├── layout.tsx           # Verifies session + resolves org (AUTH-06)
│   │   └── page.tsx             # Workspace landing (D-09, D-10)
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/route.ts  # Better Auth route handler
│   └── layout.tsx               # Root layout (ThemeProvider, QueryClientProvider)
├── lib/
│   ├── auth.ts                  # Better Auth server instance (server-only)
│   ├── auth-client.ts           # Better Auth client instance
│   ├── db.ts                    # Prisma client with Neon adapter (server-only)
│   └── dal.ts                   # Data Access Layer — verifySession() (server-only)
├── components/
│   ├── auth/
│   │   ├── sign-in-form.tsx
│   │   └── sign-up-form.tsx
│   └── workspace/
│       ├── sidebar.tsx
│       └── workspace-layout.tsx
├── actions/
│   └── auth.ts                  # signUp, signIn, signOut Server Actions
├── repositories/
│   └── interfaces/
│       └── IRepository.ts       # Base interface with organizationId on all methods
└── proxy.ts                     # Route protection (replaces middleware.ts)
```

### Pattern 1: proxy.ts Optimistic Route Protection

**What:** proxy.ts runs before every route render. It performs a cheap cookie-only check to redirect unauthenticated users to `/login` and already-authenticated users away from auth pages.

**When to use:** All routes. Auth pages are the only public routes.

**Key constraint:** proxy.ts is for optimistic checks only — do NOT do database queries here. The real auth gate is in `verifySession()` called from layouts and Server Actions.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
// proxy.ts (project root or src/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('better-auth.session_token')

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isAuthenticated = !!sessionCookie?.value

  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicRoute && isAuthenticated) {
    // Redirect to workspace — org slug must be resolved differently here
    // proxy cannot DB-query, so redirect to a server-rendered intermediary
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Critical note from official docs:** "A matcher change or a refactor that moves a Server Function to a different route can silently remove Proxy coverage. Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone."

### Pattern 2: Data Access Layer (DAL) — verifySession()

**What:** A server-only module that verifies the Better Auth session and returns a typed session object, or redirects to `/login`. Memoized with React `cache()` so it is called once per render pass regardless of how many Server Components use it.

**When to use:** Every Server Component, every Server Action, every Route Handler that needs the authenticated user.

```typescript
// Source: https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal
// src/lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect('/login')
  }

  return session
})
```

### Pattern 3: Better Auth Setup — Server Instance

```typescript
// Source: https://www.better-auth.com/docs/installation + organization plugin docs
// src/lib/auth.ts
import 'server-only'
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true, // Must be true for hook to work
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Direct Prisma insert — bypass auth.api.createOrganization to avoid
          // permission-check bugs in Better Auth <= 1.5.x (see Pitfall 1)
          const orgId = crypto.randomUUID()
          await prisma.organization.create({
            data: {
              id: orgId,
              name: `${user.name}'s Workspace`,
              slug: `${user.id.slice(0, 8)}`,
              createdAt: new Date(),
            },
          })
          await prisma.member.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: orgId,
              userId: user.id,
              role: 'admin',
              createdAt: new Date(),
            },
          })
        },
      },
    },
  },
})
```

### Pattern 4: Prisma Client with Neon Adapter

```typescript
// Source: https://neon.com/docs/guides/prisma
// src/lib/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Two connection strings required:**
- `DATABASE_URL` — pooled connection (`-pooler` in hostname), used at runtime
- `DIRECT_URL` — direct connection (no `-pooler`), used by Prisma CLI for migrations

### Pattern 5: Better Auth Route Handler

```typescript
// Source: https://www.better-auth.com/docs/installation
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { POST, GET } = toNextJsHandler(auth)
```

### Pattern 6: Server Action with Auth Check

```typescript
// Source: https://nextjs.org/docs/app/guides/authentication#server-actions
// src/actions/auth.ts
'use server'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { z } from 'zod'

// Example protected Server Action pattern (for future phases)
export async function protectedAction(formData: FormData) {
  const session = await verifySession() // redirects if not authed
  // ...
}
```

### Pattern 7: Repository Interface with organizationId

```typescript
// src/repositories/interfaces/IRepository.ts
export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string, organizationId: string): Promise<T | null>
  findAll(organizationId: string): Promise<T[]>
  create(data: CreateInput, organizationId: string): Promise<T>
  update(id: string, data: UpdateInput, organizationId: string): Promise<T>
  delete(id: string, organizationId: string): Promise<void>
}
```

### Pattern 8: Tenant Resolution in Layout

```typescript
// src/app/[org]/layout.tsx
import { verifySession } from '@/lib/dal'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ org: string }>
}) {
  const session = await verifySession()
  const { org } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug: org },
  })

  if (!organization) notFound()

  // Verify the session user is a member of this org
  const member = await prisma.member.findFirst({
    where: { organizationId: organization.id, userId: session.user.id },
  })

  if (!member) redirect('/login')

  return <>{children}</>
}
```

### Pattern 9: Prisma Schema — Required Tables for Phase 1

```prisma
// prisma/schema.prisma
// Better Auth generates: user, session, account, verification
// Organization plugin adds: organization, member, invitation
// All app tables add organizationId FK

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url omitted — lives in prisma.config.ts for Prisma 7
}

// Better Auth core tables (generated by `npx auth generate`)
model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sessions      Session[]
  accounts      Account[]
  members       Member[]
}

model Session {
  id                   String   @id
  expiresAt            DateTime
  token                String   @unique
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  ipAddress            String?
  userAgent            String?
  userId               String
  activeOrganizationId String?
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
}

// Organization plugin tables
model Organization {
  id        String   @id
  name      String
  slug      String   @unique
  logo      String?
  createdAt DateTime @default(now())
  metadata  String?
  members   Member[]
}

model Member {
  id             String       @id
  organizationId String
  userId         String
  role           String
  createdAt      DateTime     @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Invitation {
  id             String       @id
  organizationId String
  email          String
  role           String?
  status         String
  expiresAt      DateTime
  inviterId      String
  createdAt      DateTime     @default(now())
}
```

### Pattern 10: Zod Schema — Shared Sign-up Validation

```typescript
// src/lib/schemas/auth.ts
import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
```

### Anti-Patterns to Avoid

- **Using `middleware.ts`:** Next.js 16 deprecated it in favour of `proxy.ts`. Silently fails or produces unexpected behavior.
- **Auth check only in proxy.ts:** Proxy is an optimistic check. Server Actions POST directly — a proxy matcher gap silently bypasses protection. Always call `verifySession()` inside every action.
- **Calling `auth.api.createOrganization` in databaseHooks with auth checks enabled:** Multiple confirmed bugs; use direct Prisma insert instead.
- **Database queries in proxy.ts:** Proxy is designed for lightweight routing. Database calls cause performance problems and potential timeouts.
- **Storing secrets in NEXT_PUBLIC_ env vars:** Any NEXT_PUBLIC_ prefix exposes to the browser bundle. Auth secrets, DB URLs, and API keys must never use it.
- **Not using `server-only` package on lib/auth.ts and lib/db.ts:** Without it, these modules can accidentally be imported in Client Components and leak secrets.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session creation/validation | Custom JWT signing + cookie management | Better Auth (built-in cookie session) | Session token rotation, secure cookie flags, replay attack prevention, expiry logic |
| Password hashing | Custom bcrypt/argon implementation | Better Auth (scrypt natively) | Algorithm selection, salt management, timing-safe compare — all handled |
| OAuth callback flow | Custom OAuth code exchange | Better Auth socialProviders.google | PKCE, state validation, token refresh, account linking complexity |
| CSRF protection | Custom origin checking | Better Auth + Next.js (built-in) | Subtle attack surface; both handle it correctly out of the box |
| Form validation duplication | Separate server and client schemas | Zod shared schema pattern | Single source of truth; prevents client/server validation drift |
| Organization slug uniqueness | Manual DB query before creation | Better Auth organization plugin `checkSlug` or Prisma unique constraint | Race condition risk with manual check-then-insert |

**Key insight:** Auth security primitives have subtle edge cases (timing attacks, cookie flags, PKCE, token rotation) that are expensive to get right and free to get wrong. Use Better Auth for all auth mechanics.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield phase. No existing runtime state, stored data, live service config, OS registrations, secrets, or build artifacts reference any identifier being renamed or migrated.

---

## Common Pitfalls

### Pitfall 1: auth.api.createOrganization Fails in databaseHooks
**What goes wrong:** Calling `auth.api.createOrganization` inside `databaseHooks.user.create.after` throws a "You are not allowed to create a new organization" error, even with server-side context. This occurs regardless of `allowUserToCreateOrganization` setting in some Better Auth versions. Additionally, a separate foreign-key-constraint violation has been reported during social login.
**Why it happens:** The hook runs in a context where the auth permission check treats the call as a user-initiated request, not a system operation. The bug has been patched (PR #6857) but the fix may not be reliable across versions.
**How to avoid:** Bypass `auth.api` entirely — use direct Prisma inserts for the org and member rows in the hook. This is the community-confirmed working pattern.
**Warning signs:** 401 UNAUTHORIZED logged in the hook even though org creation succeeds, or org never created for Google OAuth users.

### Pitfall 2: middleware.ts vs proxy.ts
**What goes wrong:** Placing route protection logic in `middleware.ts` in a Next.js 16 project silently fails to run. Routes appear unprotected.
**Why it happens:** `middleware.ts` is deprecated in Next.js 16. The file convention was renamed to `proxy.ts` with `export function proxy()`.
**How to avoid:** Always use `proxy.ts` with `export function proxy(request: NextRequest)` or `export default function proxy(request: NextRequest)`.
**Warning signs:** Unauthenticated requests reaching protected routes with no redirect.

### Pitfall 3: Proxy as the Only Auth Gate
**What goes wrong:** Server Actions can be called as POST requests directly — if a Server Action is moved to a different route that the proxy matcher excludes, all auth protection for that action is silently dropped.
**Why it happens:** The Next.js docs explicitly warn: "A matcher change or a refactor that moves a Server Function to a different route can silently remove Proxy coverage."
**How to avoid:** Call `verifySession()` at the top of every Server Action, every Server Component that fetches data, and every Route Handler.
**Warning signs:** Data accessible via direct POST fetch() even when the page requires auth.

### Pitfall 4: Two Neon Connection Strings
**What goes wrong:** Using the pooled connection string (`-pooler`) for `prisma migrate dev` causes migration timeouts or failures. Using the direct connection string at runtime causes connection exhaustion on Vercel.
**Why it happens:** Neon pooling is optimized for runtime (many short-lived connections) but not for schema migrations. Prisma CLI needs a direct connection.
**How to avoid:** Set `DATABASE_URL` to the pooled URL (runtime use); set `DIRECT_URL` to the direct URL (Prisma CLI use). In `prisma.config.ts`, point the datasource URL to `DIRECT_URL`.
**Warning signs:** `P1001: Can't reach database server` during migrations; connection pool exhaustion errors in production.

### Pitfall 5: Organization Slug Uniqueness for Personal Workspaces
**What goes wrong:** Two users with the same display name get the same auto-generated slug, causing a unique constraint violation on `Organization.slug`.
**Why it happens:** Generating slugs from user names without uniqueness suffixes creates collisions at scale.
**How to avoid:** Use the user's ID (or a substring of it) as the slug rather than their name. Example: `user.id.slice(0, 8)` produces a unique slug that can be shown in URLs. Optionally expose a rename-org flow later.
**Warning signs:** 500 errors on registration for users with common names.

### Pitfall 6: React `cache()` Not Memoizing Across Server Action Boundaries
**What goes wrong:** `verifySession()` is called multiple times per request, hitting the auth layer each time despite being wrapped in `cache()`.
**Why it happens:** React `cache()` only memoizes within a single render pass (RSC tree). Server Actions execute in a separate context — the cache does not carry over.
**How to avoid:** This is expected behavior. Each Server Action verifies the session independently. Do not optimize this prematurely — each call is a fast cookie read in Better Auth's compact session mode.
**Warning signs:** N/A — this is expected, not a bug.

### Pitfall 7: Partial Rendering and Layout Auth Checks
**What goes wrong:** Auth check placed only in a shared layout is bypassed on client-side navigation because layouts do not re-render on every route change.
**Why it happens:** Next.js App Router uses partial rendering — only the changed segment re-renders, not parent layouts.
**How to avoid:** Auth checks belong in pages and Server Actions, not layouts. Use layouts to resolve the org and pass it down, but verify the session in each page/action.
**Warning signs:** Navigating between pages in the same org skips the auth check in the layout.

---

## Code Examples

### GitHub Actions CI Workflow (CICD-01, CICD-02)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [development, main]
  push:
    branches: [development, main]

jobs:
  lint-typecheck:
    name: Lint + Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint        # Next.js 16 flat ESLint config
      - run: npx tsc --noEmit   # TypeScript type check
      - run: npx prettier --check "src/**/*.{ts,tsx,js,jsx}"
```

### Better Auth Client Instance

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
})
```

### Google OAuth Redirect URLs

For local development, add to Google Cloud Console:
```
http://localhost:3000/api/auth/callback/google
```
For production:
```
https://notely.app/api/auth/callback/google
```

### Environment Variables Required for Phase 1

```bash
# .env.local
DATABASE_URL=postgresql://...@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Sign-Up Form with React Hook Form + Zod

```typescript
// src/components/auth/sign-up-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { signUpSchema, type SignUpInput } from '@/lib/schemas/auth'
import { useRouter } from 'next/navigation'

export function SignUpForm() {
  const router = useRouter()
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  async function onSubmit(data: SignUpInput) {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      callbackURL: '/dashboard', // redirected by server after org creation
    })
    if (error) {
      form.setError('root', { message: error.message })
      return
    }
    // D-15: redirect straight to workspace — no welcome screen
    router.push('/dashboard')
  }

  // ... form JSX
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` + `export function proxy()` | Next.js 16.0.0 | Must rename file; old convention silently fails |
| `next-auth` / Auth.js v5 | Better Auth 1.x | Q3 2025 (Auth.js team joined Better Auth) | Auth.js v5 perpetually in beta; new projects use Better Auth |
| `prisma.schema` embedded datasource URL | `prisma.config.ts` with `defineConfig()` | Prisma 7.0.0 | Old approach still works but is deprecated |
| `@prisma/client` default output | Custom output path required in Prisma 7 | Prisma 7.0.0 | Must set `output = "../src/generated/prisma"` and update imports |
| Tailwind `tailwind.config.js` | Zero-config v4 with `@theme` in globals.css | Tailwind 4.0 (Jan 2025) | No config file needed; shadcn/ui components updated for v4 |
| `useActionState` (React 18) | `useActionState` (React 19, stable) | React 19 stable | React 19 is the default in Next.js 16; `useFormStatus` also has extra fields |

**Deprecated/outdated:**
- `next-auth@5` (beta): Do not use. Auth.js team migrated to Better Auth in Sept 2025.
- `middleware.ts`: Deprecated in Next.js 16. Use `proxy.ts`.
- `prisma.schema` datasource `url` field: Deprecated for Prisma 7+ with `prisma.config.ts`. Still works but migration path is documented.

---

## Open Questions

1. **Better Auth session cookie name**
   - What we know: Better Auth uses `better-auth.session_token` as the cookie name by default (observed in source).
   - What's unclear: Whether the exact cookie name is stable across versions or configurable — proxy.ts must read the right cookie for the optimistic check.
   - Recommendation: Verify by reading the actual cookie after first auth handshake in local dev. Use `request.cookies.get('better-auth.session_token')` as the initial implementation and confirm.

2. **[org] slug after first sign-in redirect**
   - What we know: After sign-up, we redirect to `/dashboard` (a non-org route) and then need to send the user to `/[org-slug]/`. The org slug is created in the `databaseHooks.user.create.after` hook.
   - What's unclear: The best redirect target immediately after sign-up — the org slug is known only server-side at the point of creation.
   - Recommendation: Create a `/dashboard` route (Server Component) that reads the user's org from the DB and redirects to `/${org.slug}`. This is a thin redirect page, not a real page.

3. **Better Auth `activeOrganizationId` on Session**
   - What we know: The `Session` model has an `activeOrganizationId` field. The session hook pattern shows setting it during session creation.
   - What's unclear: Whether setting `activeOrganizationId` automatically or leaving it null and resolving via the `[org]` path segment is the right approach.
   - Recommendation: Resolve tenant from the `[org]` path segment (TNNT-03) rather than relying on `activeOrganizationId` — path-based is the locked decision. `activeOrganizationId` is useful for multi-org switching later (Phase 5) but not needed for v1 single-org access.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling | Yes | v24.13.1 | — |
| npm | Package management | Yes | 11.8.0 | — |
| Git | Version control / CI | Yes | 2.47.3 | — |
| Docker | Local PostgreSQL for repo tests | Yes | 29.3.0 | Use Neon dev branch directly |
| Neon PostgreSQL | Database | External (free tier) | — | Docker postgres:16-alpine for local tests |
| GitHub Actions | CI/CD (CICD-01, CICD-02) | External (free tier) | — | — |
| Google Cloud Console | OAuth credentials (AUTH-03) | External (free) | — | Skip OAuth in dev; test email/password only |

**Missing dependencies with no fallback:**
- None that block phase execution locally. GitHub Actions and Neon are external free-tier services that will be configured as part of phase work.

**Missing dependencies with fallback:**
- Neon: Docker postgres:16-alpine can run locally for repository tests. CI can use Neon dev branch.
- Google OAuth: Can defer credential setup until AUTH-03 task. Email/password auth works without it.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `vitest.config.ts` — Wave 0 gap (create during setup) |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run` |
| E2E framework | Playwright 1.58.2 |
| E2E run command | `npx playwright test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign-up with email/password creates user | E2E | `npx playwright test e2e/auth/signup.spec.ts` | Wave 0 |
| AUTH-02 | Sign-in with email/password returns session | E2E | `npx playwright test e2e/auth/signin.spec.ts` | Wave 0 |
| AUTH-03 | Google OAuth sign-in redirects to workspace | E2E (manual) | Manual — requires Google credentials | Manual only |
| AUTH-04 | Session persists across browser refresh | E2E | `npx playwright test e2e/auth/session-persistence.spec.ts` | Wave 0 |
| AUTH-05 | Org auto-created after sign-up | unit | `npx vitest run src/lib/auth.test.ts` | Wave 0 |
| AUTH-06 | Unauthenticated request redirects to /login | unit + E2E | `npx vitest run src/proxy.test.ts` | Wave 0 |
| TNNT-01 | All tables have organizationId FK | unit | `npx vitest run src/repositories/interfaces.test.ts` | Wave 0 |
| TNNT-02 | Queries scoped to org — cross-org data inaccessible | unit | `npx vitest run src/repositories/org-isolation.test.ts` | Wave 0 |
| TNNT-03 | Tenant resolved from [org] path | unit | `npx vitest run src/app/[org]/layout.test.ts` | Wave 0 |
| TNNT-04 | IRepository requires organizationId on all methods | unit (type check) | `npx tsc --noEmit` | Wave 0 |
| SEC-01 | Invalid input rejected before DB | unit | `npx vitest run src/lib/schemas/auth.test.ts` | Wave 0 |
| SEC-04 | No secrets in client bundle | manual | Build inspection + `NEXT_PUBLIC_` audit | Manual |
| SEC-05 | Unauthenticated Server Action returns early | unit | `npx vitest run src/actions/auth.test.ts` | Wave 0 |
| SEC-06 | Error responses don't leak stack traces | unit | `npx vitest run src/lib/errors.test.ts` | Wave 0 |
| CICD-01 | ESLint passes | CI | `npm run lint` | Wave 0 (CI file) |
| CICD-02 | TypeScript type check passes | CI | `npx tsc --noEmit` | Wave 0 (CI file) |

**Note on AUTH-03 (Google OAuth):** Playwright can test OAuth flows using mock OAuth providers or by running a real Google OAuth test user. For CI, use Playwright's `storageState` to save an authenticated session and reuse it — avoid re-running OAuth on every CI run.

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration with path aliases
- [ ] `playwright.config.ts` — Playwright configuration with base URL and storageState
- [ ] `.github/workflows/ci.yml` — CICD-01, CICD-02 jobs
- [ ] `src/lib/schemas/auth.test.ts` — SEC-01: Zod schema validation tests
- [ ] `src/proxy.test.ts` — AUTH-06: proxy redirect logic tests (use `unstable_doesProxyMatch` from `next/experimental/testing/server`)
- [ ] `e2e/auth/signup.spec.ts` — AUTH-01: full sign-up flow
- [ ] `e2e/auth/signin.spec.ts` — AUTH-02: sign-in flow
- [ ] `e2e/auth/session-persistence.spec.ts` — AUTH-04: browser refresh maintains session
- [ ] `e2e/auth/protected-route.spec.ts` — AUTH-06: unauthenticated redirect
- [ ] `docker-compose.yml` — Local PostgreSQL for repository unit tests
- [ ] Framework install: `npm install -D vitest @vitest/ui @playwright/test` and `npx playwright install --with-deps`

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 proxy.ts API reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — full API surface, matcher config, migration guide, confirmed v16.2.1
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) — proxy optimistic checks, DAL pattern, Server Action auth, layout caveats, v16.2.1
- [Next.js getting started: proxy](https://nextjs.org/docs/app/getting-started/proxy) — use cases, convention, examples, v16.2.1
- [Better Auth installation](https://www.better-auth.com/docs/installation) — route handler, Prisma adapter, Next.js setup
- [Better Auth organization plugin](https://www.better-auth.com/docs/plugins/organization) — auto-create pattern, slug uniqueness, member roles
- [Better Auth email/password](https://www.better-auth.com/docs/authentication/email-password) — sign-up fields, password requirements
- [Better Auth Google OAuth](https://www.better-auth.com/docs/authentication/google) — env vars, redirect URLs
- [Better Auth Prisma adapter](https://www.better-auth.com/docs/adapters/prisma) — schema generation, Prisma 7+ output path note, joins feature
- [Prisma + Neon guide](https://neon.com/docs/guides/prisma) — two connection strings, PrismaNeon adapter, prisma.config.ts
- [Prisma Better Auth + Next.js guide](https://www.prisma.io/docs/guides/betterauth-nextjs) — Prisma schema for Better Auth, migration steps
- npm registry — all package versions verified 2026-03-25

### Secondary (MEDIUM confidence)
- [Better Auth issue #2010](https://github.com/better-auth/better-auth/issues/2010) — auto-org creation; issue closed as resolved via PR #6494 but workaround documented
- [Better Auth issue #6791](https://github.com/better-auth/better-auth/issues/6791) — allowUserToCreateOrganization=false blocking hooks; fix in PR #6857
- [Better Auth issue #7260](https://github.com/better-auth/better-auth/issues/7260) — FK constraint on social login in databaseHooks.user.create.after
- [Better Auth session management docs](https://www.better-auth.com/docs/concepts/session-management) — cookie cache strategies, session access patterns

### Tertiary (LOW confidence)
- WebSearch results for GitHub Actions CI patterns — standard community patterns; verified independently with official GitHub Actions docs structure

---

## Project Constraints (from CLAUDE.md)

All directives from CLAUDE.md are binding. The planner must not recommend approaches that contradict these:

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Use `proxy.ts` not `middleware.ts` in Next.js 16 | Route protection file must be named `proxy.ts` with `export function proxy()` |
| Use Better Auth, not next-auth v5 | Auth library is locked; do not reference Auth.js patterns |
| Use `@prisma/adapter-neon` WebSocket driver | Required in Prisma client instantiation; connection will fail without it |
| `strategy: "jwt"` — database sessions break Edge runtime | Better Auth cookie-based session (compact encoding) is the correct default |
| Path-based tenant routing only — no subdomain | `[org]` dynamic segment only; never wildcard DNS or subdomain logic |
| Always read `node_modules/next/dist/docs/` before writing Next.js code | Planner must include this as a step before any Next.js file is written |
| Server Action → Service → IRepository → PrismaRepository | All mutations follow this pattern; no direct Prisma calls from Server Actions except auth bootstrap |
| No raw SQL with user input | All queries via Prisma typed methods |
| No `NEXT_PUBLIC_` for secrets | DB URL, auth secrets, Google credentials must not use NEXT_PUBLIC_ prefix |
| No real-time, no image upload, no subdomain routing | Out of scope for all phases |
| Branching: feat → development → main | CI checks must gate both development and main |
| All 3 CI checks must pass before merge | `lint-typecheck`, `test` (Vitest), `e2e` (Playwright) — all required |
| Budget: all tools must have free tier | Neon, Vercel, Upstash, Resend — confirmed free tiers sufficient |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-03-25; confirmed against CLAUDE.md locked versions
- Architecture: HIGH — proxy.ts and DAL patterns from official Next.js 16 docs; Better Auth patterns from official docs
- Pitfalls: HIGH — org creation pitfall from multiple confirmed GitHub issues with linked PRs; proxy pitfall from official Next.js docs warning
- Test architecture: MEDIUM — framework versions verified; specific test file names are recommendations based on standard patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable stack; Better Auth is actively developed — re-verify if upgrading past 1.5.x)
