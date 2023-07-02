import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as IsMacos from '../IsMacos/IsMacos.js'

const getKeybindingButtonsText = (keyBinding) => {
  if (keyBinding.startsWith('Control+')) {
    if (IsMacos.isMacos) {
      return `^${keyBinding.slice('Control+'.length)}`
    }
    return `Ctrl+${keyBinding.slice('Control+'.length)}`
  }
  return keyBinding
}

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.OpenKeyboardShortcuts)
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
        const row = keyBindingsEditor.locator(`.monaco-list-row[aria-label^="${commandName}"]:nth-of-type(1)`)
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
        await expect(rowKeybinding).toHaveText(keyBindingsButtonText, { timeout: 5000 })
      } catch (error) {
        throw new VError(error, `Failed to set keyBinding "${keyBinding}"`)
      }
    },
  }
}
