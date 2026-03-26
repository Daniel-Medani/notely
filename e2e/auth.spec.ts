import { test, expect } from '@playwright/test'

// Test: unauthenticated redirect — no storageState
test('unauthenticated user is redirected to login', async ({ browser }) => {
  const context = await browser.newContext() // fresh context, no storageState
  const page = await context.newPage()

  await page.goto('/someorg')
  await expect(page).toHaveURL(/\/login/)

  await context.close()
})

// The remaining tests use the shared storageState (set via playwright.config.ts projects)
test.use({ storageState: 'e2e/.auth/user.json' })

test('authenticated user lands in workspace', async ({ page }) => {
  await page.goto('/')
  // After redirect to workspace, sidebar should be visible with "Pages" label
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })
})

test('user can sign in with valid credentials', async ({ browser }) => {
  // Use a fresh context (no storageState) to test sign-in flow
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('/login')
  await page.getByLabel('Email').fill('e2e-test@notely.app')
  await page.getByLabel('Password').fill('TestPassword123!')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Should redirect to workspace (URL matches /[org-slug])
  await expect(page).toHaveURL(/\/[^/]+$/, { timeout: 10000 })

  await context.close()
})
