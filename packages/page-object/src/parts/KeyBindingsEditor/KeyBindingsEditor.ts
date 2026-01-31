import * as IsMacos from '../IsMacos/IsMacos.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const getKeybindingButtonsText = (keyBinding: string, platform: string) => {
  if (keyBinding.startsWith('Control+')) {
    if (IsMacos.isMacos(platform)) {
      return `⌃${keyBinding.slice('Control+'.length)}`
    }
    return `Ctrl+${keyBinding.slice('Control+'.length)}`
  }
  return keyBinding
}

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  return {
    async searchFor(searchValue: string) {
      try {
        const keyBindingsEditor = page.locator('.keybindings-editor')
        const input = keyBindingsEditor.locator('.keybindings-header input')
        await input.focus()
        await expect(input).toBeFocused()
        await input.setValue(searchValue)
      } catch (error) {
        throw new VError(error, `Failed to search for ${searchValue}`)
      }
    },
    async setKeyBinding(commandName: string, keyBinding: string) {
      try {
        const keyBindingsEditor = page.locator('.keybindings-editor')
        await expect(keyBindingsEditor).toBeVisible()
        const row = keyBindingsEditor.locator(`.monaco-list-row[aria-label^="${commandName}"]:nth-of-type(1)`)
        await expect(row).toBeVisible({
          timeout: 3000,
        })
        await row.dblclick()
        const defineKeyBindingWidget = page.locator('.defineKeybindingWidget')
        await expect(defineKeyBindingWidget).toBeVisible()
        const defineKeyBindingInput = defineKeyBindingWidget.locator('input')
        await expect(defineKeyBindingInput).toBeFocused({ timeout: 10_000 })
        await page.keyboard.press(keyBinding)
        await expect(defineKeyBindingInput).toHaveValue(keyBinding.replace('Control', 'ctrl').toLowerCase())
        await page.keyboard.press('Enter')
        await expect(defineKeyBindingWidget).toBeHidden({ timeout: 5000 })
        const keyBindingsButtonText = getKeybindingButtonsText(keyBinding, platform)
        const rowKeybinding = row.locator('.keybinding')
        await expect(rowKeybinding).toHaveText(keyBindingsButtonText, { timeout: 5000 })
      } catch (error) {
        throw new VError(error, `Failed to set keyBinding "${keyBinding}"`)
      }
    },
    async show() {
      try {
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.OpenKeyboardShortcuts)
        const keyBindingsEditor = page.locator('.keybindings-editor')
        await expect(keyBindingsEditor).toBeVisible({
          timeout: 3000,
        })
        const body = page.locator('.keybindings-body')
        await expect(body).toBeVisible()
        const list = body.locator('.monaco-list')
        await expect(list).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show keybindings editor`)
      }
    },
  }
}
