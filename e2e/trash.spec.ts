import { test, expect } from '@playwright/test'

test('deleted page appears in trash', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  const orgSlug = new URL(page.url()).pathname.split('/')[1]

  // Create a new page and rename it immediately for identification
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  const newItem = pageTree.getByText('Untitled').last()
  await expect(newItem).toBeVisible({ timeout: 5000 })

  const uniqueTitle = `TrashTarget-${Date.now()}`
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

  // Delete the page via page options
  await pageTree.getByText(uniqueTitle).hover()
  const renamedTreeItem = pageTree.getByText(uniqueTitle).locator('..').locator('..')
  await renamedTreeItem.getByLabel('Page options').click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(pageTree.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate to trash
  await page.goto(`/${orgSlug}/trash`)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })
})

test('user can restore a page from trash', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  const orgSlug = new URL(page.url()).pathname.split('/')[1]

  // Create a new page and rename it for identification
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  const newItem = pageTree.getByText('Untitled').last()
  await expect(newItem).toBeVisible({ timeout: 5000 })

  const uniqueTitle = `RestoreTarget-${Date.now()}`
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
  await expect(pageTree.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate to trash
  await page.goto(`/${orgSlug}/trash`)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Click the Restore button for this page
  await page.getByLabel(`Restore ${uniqueTitle}`).click()

  // The page should disappear from the trash list (main content area)
  await expect(page.getByRole('main').getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate back to workspace — page should appear in sidebar
  await page.goto('/dashboard')
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 })
})
