import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test('user can open search with Cmd+K', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  // Press Ctrl+K (Cmd+K on Mac maps to Meta+K, but Ctrl+K works cross-platform in Playwright)
  await page.keyboard.press('Control+k')

  // Search dialog should appear
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
  await expect(page.getByPlaceholder('Search pages...')).toBeVisible()
})

test('search returns matching pages', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  // Create a page with a unique title first
  await page.getByRole('button', { name: 'New Page' }).click()
  const untitledItem = page.getByText('Untitled').first()
  await expect(untitledItem).toBeVisible({ timeout: 5000 })

  // Navigate to the new page and set a unique title via the page title
  const orgSlug = new URL(page.url()).pathname.split('/')[1]

  // Click on the Untitled page to navigate to it
  await untitledItem.click()
  await page.waitForURL(`/${orgSlug}/**`, { timeout: 5000 })

  // Open the page options to rename it to something unique
  await page.goto('/')
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })

  const uniqueTitle = `SearchTarget-${Date.now()}`
  await page.getByText('Untitled').first().hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Rename').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill(uniqueTitle)
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Now open search and search for this title
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

  // Type the unique title (at least 2 chars to trigger search)
  await page.getByPlaceholder('Search pages...').fill(uniqueTitle.slice(0, 10))

  // Wait for search results (debounced 300ms)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })
})
