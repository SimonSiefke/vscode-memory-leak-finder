import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getWidget = () => page.locator('.call-hierarchy')
  const waitForData = async () => {
    const widget = getWidget()
    for (let attempt = 0; attempt < 100; attempt++) {
      const state = await widget.getAttribute('data-state')
      if (state === 'data') {
        return
      }
      if (state === 'message') {
        throw new Error(`Call Hierarchy did not return any items`)
      }
      const { promise, resolve } = Promise.withResolvers<void>()
      setTimeout(resolve, 100)
      await promise
    }
    throw new Error(`Timed out waiting for Call Hierarchy data`)
  }

  return {
    async close() {
      try {
        const widget = getWidget()
        await expect(widget).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(widget).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close Call Hierarchy`)
      }
    },
    async focusNext() {
      try {
        await page.keyboard.press('ArrowDown')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus the next Call Hierarchy item`)
      }
    },
    async focusPrevious() {
      try {
        await page.keyboard.press('ArrowUp')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus the previous Call Hierarchy item`)
      }
    },
    async open() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Peek Call Hierarchy')
        const widget = getWidget()
        await expect(widget).toBeVisible()
        await waitForData()
        await expect(widget.locator('.tree .monaco-list-row').first()).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open Call Hierarchy`)
      }
    },
  }
}
