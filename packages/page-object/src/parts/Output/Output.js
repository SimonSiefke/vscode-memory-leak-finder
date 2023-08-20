export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeHidden()
        await page.keyboard.press('Control+P')
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await quickPickInput.type('> Output: Focus on Output View')
        const option = quickPick.locator('.monaco-list-row', {
          hasText: 'Output: Focus on Output View',
        })
        await option.click()
        await expect(outputView).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show output`)
      }
    },
    async hide() {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        await page.keyboard.press('Control+P')
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await quickPickInput.type('> View: Close Panel')
        const option = quickPick.locator('.monaco-list-row', {
          hasText: 'View: Close Panel',
        })
        await option.click()
        await expect(outputView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to show output`)
      }
    },
  }
}
