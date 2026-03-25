import { describe, it, expect } from 'vitest'
import { signUpSchema, signInSchema } from './auth'

describe('signUpSchema', () => {
  it('accepts valid input', () => {
    const result = signUpSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = signUpSchema.safeParse({
      name: '',
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'))
      expect(nameError?.message).toBe('Enter your name.')
    }
  })

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      password: '12345678',
      confirmPassword: '12345678',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'))
      expect(emailError?.message).toBe('Enter a valid email address.')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: '1234567',
      confirmPassword: '1234567',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'))
      expect(pwError?.message).toBe('Password must be at least 8 characters.')
    }
  })

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '87654321',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(confirmError?.message).toBe('Passwords do not match.')
    }
  })
})

describe('signInSchema', () => {
  it('accepts valid input', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: 'password',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'bad',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})
