import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as KeyBindings from '../KeyBindings/KeyBindings.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  return {
    async close() {
      try {
        await this.hide()
      } catch (error) {
        throw new VError(error, `Failed to close quick pick`)
      }
    },
    async executeCommand(
      command: string,
      {
        pressKeyOnce = false,
        skipIdle = false,
        stayVisible = false,
        stopsApplication = false,
      }: { pressKeyOnce?: boolean; skipIdle?: boolean; stayVisible?: boolean | 'dont-care'; stopsApplication?: boolean } = {},
    ) {
      try {
        if (!skipIdle) {
          await page.waitForIdle()
        }
        await this.showCommands({ pressKeyOnce, skipIdle })
        await this.type(command, { skipIdle })
        await this.select(command, stayVisible, stopsApplication, { skipIdle })
        if (!stopsApplication && !skipIdle) {
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to execute command "${command}"`)
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
    async getFocusedItemLabel() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const focusedItemLabel = quickPick.locator('.monaco-list-row.focused .label-name').first()
        await expect(focusedItemLabel).toBeVisible()
        const text = await focusedItemLabel.textContent()
        if (!text) {
          throw new Error(`Focused quick pick item has no text`)
        }
        return text
      } catch (error) {
        throw new VError(error, `Failed to get focused quick pick item label`)
      }
    },
    async getInputValue() {
      try {
        const quickPickInput = await this.waitForInputVisible()
        return (await quickPickInput.getAttribute('value')) || ''
      } catch (error) {
        throw new VError(error, `Failed to get input value`)
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
            // @ts-ignore
            commands.push(text)
          }
        }
        return commands
      } catch (error) {
        throw new VError(error, `Failed to get visible commands`)
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
          const { promise, resolve } = Promise.withResolvers<void>()
          setTimeout(resolve, 2000)
          return promise
        })()
      } catch (error) {
        throw new VError(error, `Failed to hide quick pick`)
      }
    },
    async openFile(fileName: string) {
      try {
        await page.waitForIdle()
        await this.show({ key: KeyBindings.getOpenQuickPickFiles(platform || '') })
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const quickPickInput = await this.waitForInputVisible()
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
    async pressEnter() {
      try {
        const quickPickInput = await this.waitForInputVisible()
        await page.waitForIdle()
        await quickPickInput.press('Enter')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to press Enter`)
      }
    },
    async select(
      text: string | RegExp,
      stayVisible: boolean | 'dont-care' = false,
      stopsApplication = false,
      { skipIdle = false }: { skipIdle?: boolean } = {},
    ) {
      try {
        if (!skipIdle) {
          await page.waitForIdle()
        }
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        let selectedAt: number
        if (typeof text === 'string') {
          const option = quickPick.locator('.label-name', {
            hasExactText: text,
          })
          await expect(option).toBeVisible()
          if (!skipIdle) {
            await page.waitForIdle()
          }
          selectedAt = performance.timeOrigin + performance.now()
          await option.click()
        } else {
          const normal = `${text}`.slice(1, -1)
          const item = quickPick.locator(`.monaco-list-row[aria-label*="${normal}"]`)
          await expect(item).toBeVisible()
          if (!skipIdle) {
            await page.waitForIdle()
          }
          const label = item.locator('.label-name')
          selectedAt = performance.timeOrigin + performance.now()
          await label.click()
        }
        if (!stayVisible) {
          await expect(quickPick).toBeHidden()
        }
        if (!stopsApplication && !skipIdle) {
          await page.waitForIdle()
        }
        return selectedAt
      } catch (error) {
        throw new VError(error, `Failed to select "${text}"`)
      }
    },
    async show({ key = KeyBindings.getOpenQuickPickFiles(platform), pressKeyOnce = false, skipIdle = false } = {}) {
      try {
        if (!skipIdle) {
          await page.waitForIdle()
        }
        const quickPick = page.locator('.quick-input-widget')
        // TODO there might be a conflict here when pressing the keyboard shortcut
        // too often, the quickpick opens, making the next statement pass
        // but then the keyboard shortcut is still processing, making the quickpick close again
        if (pressKeyOnce) {
          await page.keyboard.press(key)
        } else {
          await page.pressKeyExponential({
            key: key,
            waitFor: quickPick,
          })
        }
        await expect(quickPick).toBeVisible({
          timeout: 10_000,
        })
        await expect(quickPick).toBeVisible()
        if (!skipIdle) {
          await page.waitForIdle()
        }
        await this.waitForInputVisible()
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
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
    async showCommands({ pressKeyOnce = false, skipIdle = false } = {}) {
      try {
        return this.show({ key: KeyBindings.getOpenQuickPickCommands(platform || ''), pressKeyOnce, skipIdle })
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`)
      }
    },
    async showFileIconTheme() {
      try {
        await this.executeCommand(WellKnownCommands.SelectFileIconTheme, {
          stayVisible: true,
        })
      } catch (error) {
        throw new VError(error, `Failed to show quick pick file icon theme`)
      }
    },
    async type(value: string, { skipIdle = false }: { skipIdle?: boolean } = {}) {
      try {
        const quickPickInput = await this.waitForInputVisible()
        await quickPickInput.type(value)
        if (!skipIdle) {
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to type ${value}`)
      }
    },
    async waitForCommand(command: string, timeout = 120_000) {
      try {
        const deadline = performance.now() + timeout
        const quickPick = page.locator('.quick-input-widget')
        while (performance.now() < deadline) {
          await this.showCommands()
          await this.type(command)
          const option = quickPick.locator('.label-name', {
            hasExactText: command,
          })
          if (await option.isVisible().catch(() => false)) {
            await page.keyboard.press(KeyBindings.Escape)
            await expect(quickPick).toBeHidden()
            return
          }
          await page.keyboard.press(KeyBindings.Escape)
          await expect(quickPick).toBeHidden()
          await new Promise((resolve) => setTimeout(resolve, 250))
        }
        throw new Error(`Command did not become available within ${timeout}ms`)
      } catch (error) {
        throw new VError(error, `Failed to wait for command "${command}"`)
      }
    },
    async waitForInputVisible() {
      const quickPick = page.locator('.quick-input-widget')
      const quickPickInput = quickPick.locator('.ibwrapper .input')
      await expect(quickPickInput).toBeVisible()
      await expect(quickPickInput).toBeFocused({ timeout: 3000 })
      return quickPickInput
    },
  }
}
