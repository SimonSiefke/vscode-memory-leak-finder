import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ page, expect, VError }) => {
  return {
    async create(info) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ProfilesCreateProfile, {
          stayVisible: true,
        })
        const input = page.locator('[placeholder="Profile name"]')
        await expect(input).toBeVisible()
        await expect(input).toBeFocused()
        await input.type(info.name)
        await page.waitForIdle()
        const createButton = page.locator('.monaco-button', {
          hasText: 'Create',
        })
        await createButton.click()
        const profileBadge = page.locator('.profile-badge', {
          hasText: 'TE',
        })
        await expect(profileBadge).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to create profile`)
      }
    },
    async remove(info) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ProfilesDeleteProfile, {
          stayVisible: true,
        })
        const input = page.locator('[placeholder="Select Profiles to Delete"]')
        await input.type(info.name)
        const row = page.locator('.monaco-list-row[aria-label="test, Current"]')
        const rowLabel = row.locator('.quick-input-list-label')
        await rowLabel.click()
        await expect(row).toHaveAttribute('aria-checked', 'true')
        const okButton = page.locator('.monaco-button', {
          hasText: 'OK',
        })
        await okButton.click()
        const profileBadge = page.locator('.profile-badge', {
          hasText: 'TE',
        })
        await expect(profileBadge).toHaveCount(0)
      } catch (error) {
        throw new VError(error, `Failed to remove profile`)
      }
    },
    async export({ name }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ProfilesExport)
        const profileViewContainer = page.locator('.profile-view-tree-container')
        await expect(profileViewContainer).toBeVisible()
        const settings = profileViewContainer.locator('[aria-label="Settings "]')
        await expect(settings).toBeVisible()
        await expect(settings).toHaveAttribute('aria-expanded', 'true')
        const exportButton = page.locator('.profile-view-button', {
          hasText: 'Export',
        })
        await expect(exportButton).toBeVisible()
        await exportButton.click()
        const quickInput = page.locator('.quick-input-box input')
        await expect(quickInput).toBeVisible()
        await quickInput.type(name)
        await page.keyboard.press('Enter')
        const quickInputTitle = page.locator('.quick-input-title')
        await expect(quickInputTitle).toBeVisible()
        await expect(quickInputTitle).toHaveText(`Export '${name}' profile as...`)
        const fileOption = page.locator('.quick-input-list-entry .label-description', {
          hasText: 'file',
        })
        await expect(fileOption).toBeVisible()
        await fileOption.click()
      } catch (error) {
        throw new VError(error, `Failed to export profile`)
      }
    },
  }
}
