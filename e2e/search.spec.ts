import { test, expect } from '@playwright/test'

test('user can open search with Cmd+K', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Ensure page body is focused before sending keyboard shortcut
  await page.locator('body').click()
  await page.keyboard.press('Control+k')

  // Search dialog should appear
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await expect(page.getByPlaceholder('Search pages...')).toBeVisible()
})

test('search returns matching pages', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Create a page
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  await expect(pageTree.getByText('Untitled').last()).toBeVisible({ timeout: 5000 })

  // Rename it to something unique via page options on the last Untitled item
  const uniqueTitle = `SearchTarget-${Date.now()}`
  const newItem = pageTree.getByText('Untitled').last()
  await newItem.hover()
  // The page options button is within the same tree item
  const treeItem = newItem.locator('..').locator('..')
  await treeItem.getByLabel('Page options').click()
  await page.getByRole('menuitem', { name: 'Rename' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill(uniqueTitle)
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  await expect(pageTree.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Now open search and search for this title
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

  // Type the unique title (at least 2 chars to trigger search)
  await page.getByPlaceholder('Search pages...').fill(uniqueTitle.slice(0, 10))

  // Wait for search results (debounced 300ms)
  await expect(page.getByText(uniqueTitle).last()).toBeVisible({ timeout: 5000 })
})
