export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code }
  }

  // SEC-06: Never leak stack traces or internal error details
  console.error('Unexpected error:', error)
  return {
    success: false,
    error: 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
  }
}
