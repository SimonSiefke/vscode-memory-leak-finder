import * as KeyBindings from '../KeyBindings/KeyBindings.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async show(key = KeyBindings.OpenQuickPickFiles) {
      try {
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        // TODO there might be a conflict here when pressing the keyboard shortcut
        // too often, the quickpick opens, making the next statement pass
        // but then the keyboard shortcut is still processing, making the quickpick close again
        await page.pressKeyExponential({
          key: key,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({
          timeout: 10_000,
        })
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
      }
    },
    async showCommands() {
      try {
        return this.show(KeyBindings.OpenQuickPickCommands)
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
      }
    },
    async type(value) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused({ timeout: 3000 })
        await quickPickInput.type(value)
      } catch (error) {
        throw new VError(error, `Failed to type ${value}`)
      }
    },
    async pressEnter() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused({ timeout: 3000 })
        await quickPickInput.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to press Enter`)
      }
    },
    async getInputValue() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        return await quickPickInput.inputValue()
      } catch (error) {
        throw new VError(error, `Failed to get input value`)
      }
    },
    async select(text, stayVisible = false) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasExactText: text,
        })
        await option.click()
        if (!stayVisible) {
          await expect(quickPick).toBeHidden()
        }
      } catch (error) {
        throw new VError(error, `Failed to select "${text}"`)
      }
    },
    async executeCommand(command, { stayVisible = false } = {}) {
      try {
        await page.waitForIdle()
        await this.showCommands()
        await this.type(command)
        await this.select(command, stayVisible)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to execute command "${command}"`)
      }
    },
    async openFile(fileName) {
      try {
        await page.waitForIdle()
        await this.show(KeyBindings.OpenQuickPickFiles)
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused({ timeout: 3000 })
        const option = quickPick.locator('.label-name', {
          hasText: fileName,
        })
        await quickPickInput.typeAndWaitFor(fileName, option, {
          timeout: 6000,
        })
        await this.select(fileName)
      } catch (error) {
        throw new VError(error, `Failed to open "${fileName}"`)
      }
    },
    async showColorTheme() {
      try {
        await this.executeCommand(WellKnownCommands.SelectColorTheme, {
          stayVisible: true,
        })
      } catch (error) {
        throw new VError(error, `Failed to show quick pick color theme`)
      }
    },
    async focusNext() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press(KeyBindings.ArrowDown)
      } catch (error) {
        throw new VError(error, `Failed to focus next quick pick item`)
      }
    },
    async focusPrevious() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press(KeyBindings.ArrowUp)
      } catch (error) {
        throw new VError(error, `Failed to focus previous quick pick item`)
      }
    },
    async hide() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        await page.keyboard.press(KeyBindings.Escape)
        await expect(quickPick).toBeHidden()
        await page.waitForIdle()
        await (() => {
          const { resolve, promise } = Promise.withResolvers<void>()
          setTimeout(resolve, 2000)
          return promise
        })()
      } catch (error) {
        throw new VError(error, `Failed to hide quick pick`)
      }
    },
    async close() {
      try {
        await this.hide()
      } catch (error) {
        throw new VError(error, `Failed to close quick pick`)
      }
    },
    async getVisibleCommands() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const commandElements = quickPick.locator('.monaco-list-row .label-name')
        const count = await commandElements.count()
        const commands = []
        for (let i = 0; i < count; i++) {
          const text = await commandElements.nth(i).textContent()
          if (text) {
            commands.push(text)
          }
        }
        return commands
      } catch (error) {
        throw new VError(error, `Failed to get visible commands`)
      }
    },
  }
}
