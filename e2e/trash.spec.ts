import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/user.json' })

test('deleted page appears in trash', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  const orgSlug = new URL(page.url()).pathname.split('/')[1]

  // Create a new page
  await page.getByRole('button', { name: 'New Page' }).click()
  const pageItem = page.getByText('Untitled').first()
  await expect(pageItem).toBeVisible({ timeout: 5000 })

  // Rename it to something unique so we can identify it in trash
  const uniqueTitle = `TrashTarget-${Date.now()}`
  await pageItem.hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Rename').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill(uniqueTitle)
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Delete the page
  await page.getByText(uniqueTitle).hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Delete').click()
  await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate to trash
  await page.goto(`/${orgSlug}/trash`)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })
})

test('user can restore a page from trash', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages')).toBeVisible({ timeout: 10000 })

  const orgSlug = new URL(page.url()).pathname.split('/')[1]

  // Create and immediately delete a page
  await page.getByRole('button', { name: 'New Page' }).click()
  const pageItem = page.getByText('Untitled').first()
  await expect(pageItem).toBeVisible({ timeout: 5000 })

  const uniqueTitle = `RestoreTarget-${Date.now()}`
  await pageItem.hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Rename').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const input = page.getByRole('dialog').getByRole('textbox')
  await input.clear()
  await input.fill(uniqueTitle)
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click()
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Delete the page
  await page.getByText(uniqueTitle).hover()
  await page.getByLabel('Page options').first().click()
  await page.getByText('Delete').click()
  await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate to trash
  await page.goto(`/${orgSlug}/trash`)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })

  // Click the Restore button for this page
  await page.getByLabel(`Restore ${uniqueTitle}`).click()

  // The page should disappear from trash
  await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 })

  // Navigate back to workspace — page should appear in sidebar
  await page.goto(`/${orgSlug}`)
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 })
})
