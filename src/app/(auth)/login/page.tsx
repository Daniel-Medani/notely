import { SignInForm } from '@/components/auth/sign-in-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  return <SignInForm callbackUrl={callbackUrl} />
}
