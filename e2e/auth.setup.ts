import { test as setup, expect } from '@playwright/test'
import path from 'path'

const STORAGE_STATE = path.join(__dirname, '.auth', 'user.json')

const TEST_EMAIL = 'e2e-test@notely.app'
const TEST_PASSWORD = 'TestPassword123!'

setup('authenticate', async ({ page }) => {
  // Try sign-in first (test user may already exist from previous run)
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for redirect to workspace (dashboard → /[org])
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 })
    // Dashboard redirects to /${orgSlug}
    await page.waitForURL(/\/[^/]+$/, { timeout: 5000 })
  } catch {
    // Sign-in failed — user doesn't exist yet, sign up
    await page.goto('/register')
    await page.getByLabel('Name').fill('E2E Test User')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()

    // Wait for redirect through dashboard to org workspace
    await page.waitForURL(/\/[^/]+$/, { timeout: 15000 })
  }

  // Verify we landed in the workspace
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Save auth state
  await page.context().storageState({ path: STORAGE_STATE })
})
