import * as Character from '../Character/Character.js'
import * as SettingsEditorInput from '../SettingsEditorInput/SettingsEditorInput.js'

export const create = ({ expect, page, VError }) => {
  return {
    async select({ completionName, completionText }) {
      try {
        const suggest = page.locator('.settings-header .suggest-input-container .suggest-widget')
        await expect(suggest).toBeVisible()
        const rows = suggest.locator('.monaco-list-rows')
        await expect(rows).toBeVisible()
        const row = rows.locator(`[role="option"][aria-label="${completionName} "]`)
        await expect(row).toBeVisible()
        await page.waitForIdle()
        await row.click()
        await page.waitForIdle()
        await expect(suggest).toBeHidden()
        const settingsEditorInput = SettingsEditorInput.create({ page, expect, VError })
        await settingsEditorInput.shouldHaveText(`${completionText}${Character.NonBreakingSpace}`)
      } catch (error) {
        throw new VError(error, `Failed to select completion ${completionName}`)
      }
    },
  }
}
