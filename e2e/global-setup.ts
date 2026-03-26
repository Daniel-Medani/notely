import { chromium, type FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const AUTH_DIR = path.join(__dirname, '.auth')
const STORAGE_STATE = path.join(AUTH_DIR, 'user.json')

const TEST_EMAIL = 'e2e-test@notely.app'
const TEST_PASSWORD = 'TestPassword123!'

async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Try sign-in first (test user may already exist from previous run)
  await page.goto('http://localhost:3000/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Check if sign-in succeeded (redirect to workspace)
  try {
    await page.waitForURL(/\/[^/]+$/, { timeout: 5000 })
  } catch {
    // Sign-in failed — user doesn't exist yet, sign up instead
    await page.goto('http://localhost:3000/register')
    await page.getByLabel('Name').fill('E2E Test User')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()
    await page.waitForURL(/\/[^/]+$/, { timeout: 15000 })
  }

  // Save auth state
  await page.context().storageState({ path: STORAGE_STATE })

  // Save test credentials for specs to reference
  fs.writeFileSync(
    path.join(AUTH_DIR, 'test-credentials.json'),
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  )

  await browser.close()
}

export default globalSetup
