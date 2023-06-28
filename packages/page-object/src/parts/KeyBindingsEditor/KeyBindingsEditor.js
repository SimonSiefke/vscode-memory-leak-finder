const getKeybindingButtonsText = (keyBinding) => {
  if (keyBinding.startsWith('Control+')) {
    return `Ctrl+${keyBinding.slice('Control+'.length)}`
  }
  return keyBinding
}

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: 'Control+P',
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({
          timeout: 10_000,
        })
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await quickPickInput.type('> open keyboard shortcuts')
        const option = quickPick.locator('.label-name', {
          hasText: 'Preferences: Open Keyboard Shortcuts',
        })
        await option.click()
        const keyBindingsEditor = page.locator('.keybindings-editor')
        await expect(keyBindingsEditor).toBeVisible({
          timeout: 3_000,
        })
        const body = page.locator('.keybindings-body')
        await expect(body).toBeVisible()
        const list = body.locator('.monaco-list')
        await expect(list).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show keybindings editor`)
      }
    },
    async setKeyBinding(commandName, keyBinding) {
      try {
        const keyBindingsEditor = page.locator('.keybindings-editor')
        await expect(keyBindingsEditor).toBeVisible()
        const row = keyBindingsEditor.locator(`.monaco-list-row[aria-label^="${commandName}"]`).first()
        await row.dblclick()
        console.log(await row.textContent())
        console.log('double clicked')
        await new Promise(() => {})
        const defineKeyBindingWidget = page.locator('.defineKeybindingWidget')
        await expect(defineKeyBindingWidget).toBeVisible()
        const defineKeyBindingInput = defineKeyBindingWidget.locator('input')
        await expect(defineKeyBindingInput).toBeFocused({ timeout: 10_000 })
        await page.keyboard.press(keyBinding)
        await expect(defineKeyBindingInput).toHaveValue(keyBinding.replace('Control', 'ctrl').toLowerCase())
        await page.keyboard.press('Enter')
        await expect(defineKeyBindingWidget).toBeHidden()
        const keyBindingsButtonText = getKeybindingButtonsText(keyBinding)
        const rowKeybinding = row.locator('.keybinding')
        await expect(rowKeybinding).toHaveText(keyBindingsButtonText)
      } catch (error) {
        throw new VError(error, `Failed to set keyBinding ${keyBinding}`)
      }
    },
  }
}
