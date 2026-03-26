import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test('user can create a new page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  // Click "New Page" button in sidebar
  await page.getByRole('button', { name: 'New Page' }).click()

  // A new page item should appear in the sidebar tree
  // New pages are created as "Untitled"
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })
})

test('user can rename a page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  // Create a page first
  await page.getByRole('button', { name: 'New Page' }).click()
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })

  // Open the page options menu for the first page item
  // Hover over the page item to reveal the "..." button
  const pageItem = page.getByText('Untitled').first()
  await pageItem.hover()
  await page.getByLabel('Page options').first().click()

  // Click Rename in the dropdown
  await page.getByText('Rename').click()

  // The rename dialog should open
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

  // Clear and type new name
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill('My Renamed Page')
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()

  // The new title should appear in the sidebar
  await expect(page.getByText('My Renamed Page')).toBeVisible({ timeout: 5000 })
})

test('user can delete a page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  // Create a page to delete
  await page.getByRole('button', { name: 'New Page' }).click()
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })

  // Count pages before delete
  const untitledCount = await page.getByText('Untitled').count()

  // Open page options and delete
  const pageItem = page.getByText('Untitled').first()
  await pageItem.hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Delete').click()

  // Page should be removed from sidebar
  await expect(page.getByText('Untitled')).toHaveCount(Math.max(0, untitledCount - 1), {
    timeout: 5000,
  })
})
