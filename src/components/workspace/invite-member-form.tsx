'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { inviteMemberAction } from '@/lib/actions/org-actions'

const inviteFormSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface InviteMemberFormProps {
  organizationId: string
}

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: '' },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(data: InviteFormValues) {
    setServerError(null)
    setSuccessEmail(null)

    const result = await inviteMemberAction({
      organizationId,
      email: data.email,
      role: 'member',
    })

    if (result.success) {
      setSuccessEmail(data.email)
      form.reset()
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold">Invite a member</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      className="flex-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              Send Invite
            </Button>
          </div>
          {successEmail && (
            <p className="mt-2 text-sm text-muted-foreground">
              Invitation sent to {successEmail}
            </p>
          )}
          {serverError && (
            <p className="mt-2 text-sm text-destructive">{serverError}</p>
          )}
        </form>
      </Form>
    </div>
  )
}
