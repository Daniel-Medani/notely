'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { authClient } from '@/lib/auth-client'
import { signUpSchema, type SignUpInput } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignUpInput) {
    setIsLoading(true)
    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: '/dashboard',
      })

      if (result.error) {
        const message = result.error.message ?? ''
        if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('email taken')) {
          form.setError('email', {
            message: 'An account with this email already exists. Sign in instead.',
          })
        } else {
          form.setError('root', {
            message: 'Something went wrong. Please try again.',
          })
        }
        return
      }

      router.push('/dashboard')
    } catch {
      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-8">
        <p className="text-[28px] font-semibold leading-[1.15] text-center mb-8">
          Notely
        </p>
        <h1 className="text-[20px] font-semibold leading-[1.2] text-center mb-6">
          Create your account
        </h1>

        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="size-4"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.6-4.2 7.3-10.5 7.3-17.3z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-10H2.5v6.2C6.5 42.5 14.7 48 24 48z"
            />
            <path
              fill="#FBBC05"
              d="M10.5 28.5c-.5-1.5-.8-3.2-.8-4.8s.3-3.3.8-4.8v-6.2H2.5C.9 16 0 19.9 0 24s.9 8 2.5 11.3l8-6.8z"
            />
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.1 30.4 0 24 0 14.7 0 6.5 5.5 2.5 13.5l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
            or
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive text-center">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
