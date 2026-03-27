import { test, expect } from '@playwright/test'

test('user can create a new page', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Click "New Page" button in sidebar
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()

  // A new page item should appear in the sidebar tree
  // New pages are created as "Untitled"
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })
})

test('user can rename a page', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Create a page first
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()
  await expect(page.getByText('Untitled').first()).toBeVisible({ timeout: 5000 })

  // Open the page options menu for the first page item
  // Hover over the page item to reveal the "..." button
  const pageItem = page.getByText('Untitled').first()
  await pageItem.hover()
  await page.getByLabel('Page options').first().click()

  // Click Rename in the dropdown
  await page.getByRole('menuitem', { name: 'Rename' }).click()

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
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Create a page and rename it so we can track it uniquely
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  const newItem = pageTree.getByText('Untitled').last()
  await expect(newItem).toBeVisible({ timeout: 5000 })

  const uniqueTitle = `DeleteTarget-${Date.now()}`
  await newItem.hover()
  const treeItem = newItem.locator('..').locator('..')
  await treeItem.getByLabel('Page options').click()
  await page.getByRole('menuitem', { name: 'Rename' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill(uniqueTitle)
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  await expect(pageTree.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Delete the page
  await pageTree.getByText(uniqueTitle).hover()
  const renamedTreeItem = pageTree.getByText(uniqueTitle).locator('..').locator('..')
  await renamedTreeItem.getByLabel('Page options').click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()

  // Page should be removed from sidebar
  await expect(pageTree.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })
})
