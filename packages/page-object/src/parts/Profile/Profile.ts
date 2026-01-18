import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

interface ProfileCreateInfo {
  readonly name: string
  readonly removeOthers?: boolean
}

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async create(info: ProfileCreateInfo) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ProfilesNewProfile, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        const profilesEditor = page.locator('.profiles-editor')
        await expect(profilesEditor).toBeVisible()
        await page.waitForIdle()
        const profilesList = page.locator('.profiles-list')
        await expect(profilesList).toBeVisible()
        await page.waitForIdle()
        if (info.removeOthers) {
          await this.removeOtherProfiles()
        }
        const input = page.locator('.profile-row-container .input')
        await expect(input).toBeVisible()
        await input.focus()
        await expect(input).toBeFocused()
        await input.fill(info.name)
        await page.waitForIdle()
        const createButton = page.locator('.profile-row-container .monaco-button', {
          hasText: 'Create',
        })
        await createButton.click()

        const profileListItem = profilesList.locator(`.profile-list-item[aria-label="${info.name}"]`)
        await expect(profileListItem).toBeVisible()
        const useButton = profileListItem.locator('[aria-label="Use this Profile for Current Window"]')
        await useButton.click()

        const profileBadge = page.locator('.profile-badge', {
          hasText: 'TE',
        })
        await expect(profileListItem).toBeVisible()
        await expect(profileBadge).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to create profile`)
      }
    },
    async export({ name }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
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
        await page.waitForIdle()
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
    async remove(info) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
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
    async removeOtherProfiles() {
      try {
        const profilesList = page.locator('.profiles-list')
        const profileListIems = profilesList.locator(`.profile-list-item`)
        const contextMenu = ContextMenu.create({ expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        const count = await profileListIems.count()
        for (let i = 2; i < count; i++) {
          const second = profileListIems.nth(1)
          await contextMenu.open(second)
          await contextMenu.shouldHaveItem('Delete')
          await contextMenu.select('Delete')
          await expect(profileListIems).toHaveCount(count - i + 1)
        }
      } catch (error) {
        throw new VError(error, `Failed to remove other profiles`)
      }
    },
  }
}
