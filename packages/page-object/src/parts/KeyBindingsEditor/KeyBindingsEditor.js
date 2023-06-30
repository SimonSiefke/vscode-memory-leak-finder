import * as QuickPick from '../QuickPick/QuickPick.js'

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
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.showCommands()
        await quickPick.type('> open keyboard shortcuts')
        await quickPick.select('Preferences: Open Keyboard Shortcuts')
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
    async searchFor(searchValue) {
      try {
        const keyBindingsEditor = page.locator('.keybindings-editor')
        const input = keyBindingsEditor.locator('.keybindings-header input')
        await expect(input).toBeFocused()
        await input.type(searchValue)
      } catch (error) {
        throw new VError(error, `Failed to search for ${searchValue}`)
      }
    },
    async setKeyBinding(commandName, keyBinding) {
      try {
        const keyBindingsEditor = page.locator('.keybindings-editor')
        await expect(keyBindingsEditor).toBeVisible()
        const row = keyBindingsEditor.locator(`.monaco-list-row[aria-label^="${commandName}"]`).first()
        await row.dblclick()
        const defineKeyBindingWidget = page.locator('.defineKeybindingWidget')
        await expect(defineKeyBindingWidget).toBeVisible()
        const defineKeyBindingInput = defineKeyBindingWidget.locator('input')
        await expect(defineKeyBindingInput).toBeFocused({ timeout: 10_000 })
        await page.keyboard.press(keyBinding)
        await expect(defineKeyBindingInput).toHaveValue(keyBinding.replace('Control', 'ctrl').toLowerCase())
        await page.keyboard.press('Enter')
        await expect(defineKeyBindingWidget).toBeHidden({ timeout: 5000 })
        const keyBindingsButtonText = getKeybindingButtonsText(keyBinding)
        const rowKeybinding = row.locator('.keybinding')
        await expect(rowKeybinding).toHaveText(keyBindingsButtonText)
      } catch (error) {
        throw new VError(error, `Failed to set keyBinding ${keyBinding}`)
      }
    },
  }
}
