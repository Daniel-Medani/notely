import 'server-only'
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 10,
    storage: 'memory',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'admin',
      sendInvitationEmail: async (data) => {
        if (!process.env.RESEND_API_KEY) {
          console.warn('RESEND_API_KEY not set - invitation email skipped')
          return
        }
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const acceptUrl = `${process.env.BETTER_AUTH_URL}/invite/${data.invitation.id}`
        await resend.emails.send({
          from: 'Notely <noreply@notely.app>',
          to: data.invitation.email,
          subject: `You've been invited to join ${data.organization.name} on Notely`,
          html: `
            <p>You've been invited to join <strong>${data.organization.name}</strong> on Notely.</p>
            <p><a href="${acceptUrl}">Accept Invitation</a></p>
            <p>This link will expire in 48 hours.</p>
          `,
        })
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Direct Prisma insert — bypass auth.api.createOrganization to avoid
          // permission-check bugs in Better Auth <= 1.5.x (see RESEARCH.md Pitfall 1)
          // Per D-08: org named "{User's name}'s Workspace"
          const orgId = crypto.randomUUID()
          await prisma.organization.create({
            data: {
              id: orgId,
              name: `${user.name}'s Workspace`,
              slug: user.id.slice(0, 8), // unique slug from user ID to avoid collisions (Pitfall 5)
              createdAt: new Date(),
            },
          })
          await prisma.member.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: orgId,
              userId: user.id,
              role: 'admin', // Per AUTH-05: user is Admin of their personal org
              createdAt: new Date(),
            },
          })
        },
      },
    },
  },
})
