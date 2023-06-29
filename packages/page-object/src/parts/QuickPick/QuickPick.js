export const create = ({ expect, page, VError }) => {
  return {
    async show(key = 'Control+P') {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: key,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({
          timeout: 10_000,
        })
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
      }
    },
    async showCommands() {
      try {
        return this.show('Control+Shift+P')
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
      }
    },
    async type(value) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused({ timeout: 3000 })
        await quickPickInput.type(value)
      } catch (error) {
        throw new VError(error, `Failed to type ${value}`)
      }
    },
    async select(text) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasText: text,
        })
        await option.click()
        await expect(quickPick).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to select ${text}`)
      }
    },
    async showColorTheme() {
      try {
        await page.keyboard.press('Control+Shift+P')
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[role="combobox"]')
        // await expect(quickPickInput).toHaveText(">");
        await quickPickInput.type('Preferences: Color Theme')
        const firstOption = quickPick.locator('.monaco-list-row').first()
        const firstOptionLabel = firstOption.locator('.label-name')
        await expect(firstOptionLabel).toHaveText('Preferences: Color Theme')
        await expect(firstOption).toBeVisible()
        await firstOption.click()
      } catch (error) {
        throw new VError(error, `Failed to show quick pick color theme`)
      }
    },
    async focusNext() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press('ArrowDown')
      } catch (error) {
        throw new VError(error, `Failed to focus next quick pick item`)
      }
    },
    async focusPrevious() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press('ArrowUp')
      } catch (error) {
        throw new VError(error, `Failed to focus previous quick pick item`)
      }
    },
    async hide() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(quickPick).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide quick pick`)
      }
    },
  }
}
