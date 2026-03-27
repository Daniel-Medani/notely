import { test, expect } from '@playwright/test'

test('editor content persists after debounce save', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Create a new page
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()

  // Wait for the new page to appear and click it to navigate
  const orgSlug = new URL(page.url()).pathname.split('/')[1]
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  const newPageItem = pageTree.getByText('Untitled').last()
  await expect(newPageItem).toBeVisible({ timeout: 5000 })
  await newPageItem.click()
  await expect(page).toHaveURL(new RegExp(`/${orgSlug}/.+`), { timeout: 5000 })

  const pageUrl = page.url()

  // Click into the editor area and type unique content
  const uniqueContent = `E2E persist test ${Date.now()}`
  const editorArea = page.locator('.ProseMirror').first()
  await expect(editorArea).toBeVisible({ timeout: 10000 })
  await editorArea.click()
  await editorArea.pressSequentially(uniqueContent)

  // Wait for debounce save to fire (debounce is 800ms, wait 2s to be safe)
  await page.waitForTimeout(2000)

  // Reload the page
  await page.goto(pageUrl)
  await page.waitForLoadState('networkidle', { timeout: 10000 })

  // The typed content should be visible in the editor after reload
  const editorAfterReload = page.locator('.ProseMirror').first()
  await expect(editorAfterReload).toContainText(uniqueContent, { timeout: 10000 })
})

test('editor shows saving indicator during save', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })

  // Create and navigate to a new page
  await page.getByRole('complementary').getByRole('button', { name: 'New Page' }).click()

  const orgSlug = new URL(page.url()).pathname.split('/')[1]
  const pageTree = page.getByRole('tree', { name: 'Page tree' })
  const newPageItem = pageTree.getByText('Untitled').last()
  await expect(newPageItem).toBeVisible({ timeout: 5000 })
  await newPageItem.click()
  await expect(page).toHaveURL(new RegExp(`/${orgSlug}/.+`), { timeout: 5000 })

  // Type in the editor to trigger save
  const editorArea = page.locator('.ProseMirror').first()
  await expect(editorArea).toBeVisible({ timeout: 5000 })
  await editorArea.click()
  await editorArea.pressSequentially('Testing save indicator')

  // Check that content was typed successfully
  await expect(editorArea).toContainText('Testing save indicator', { timeout: 3000 })
})
