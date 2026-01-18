import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as Character from '../Character/Character.ts'
import * as SettingsEditorInput from '../SettingsEditorInput/SettingsEditorInput.ts'

export const create = ({ expect, page, VError }: CreateParams.CreateParams) => {
  return {
    async select({ completionName, completionText }) {
      try {
        await page.waitForIdle()
        const suggest = page.locator('.settings-header .suggest-input-container .suggest-widget')
        await expect(suggest).toBeVisible()
        const rows = suggest.locator('.monaco-list-rows')
        await expect(rows).toBeVisible()
        const row = rows.locator(`[role="option"][aria-label="${completionName} , Keyword"]`)
        await expect(row).toBeVisible()
        await page.waitForIdle()
        await row.click()
        await page.waitForIdle()
        await expect(suggest).toBeHidden()
        const settingsEditorInput = SettingsEditorInput.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform: undefined, VError })
        await settingsEditorInput.shouldHaveText(`${completionText}${Character.NonBreakingSpace}`)
      } catch (error) {
        throw new VError(error, `Failed to select completion ${completionName}`)
      }
    },
  }
}
