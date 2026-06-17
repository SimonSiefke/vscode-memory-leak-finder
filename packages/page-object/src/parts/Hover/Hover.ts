import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async hide() {
      try {
        await page.waitForIdle()
        const hover = page.locator('.monaco-hover')
        await expect(hover).toBeVisible()
        await page.waitForIdle()
        let tries = 0
        while (true) {
          await hover.focus()
          await page.keyboard.press('Escape')
          const isVisible = await hover.isVisible()
          if (!isVisible) {
            break
          }
          tries++
          if (tries === 11) {
            throw new Error(`Failed to wait for hover to be hidden`)
          }
        }
        await expect(hover).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide hover`)
      }
    },
    async shouldHaveText(text: string) {
      try {
        const tooltip = page.locator('.monaco-hover')
        await expect(tooltip).toBeVisible()
        await expect(tooltip).toContainText(text)
      } catch (error) {
        throw new VError(error, `Failed to check that hover has text "${text}"`)
      }
    },
    async shouldHaveActions() {
      try {
        const tooltip = page.locator('.monaco-hover')
        await expect(tooltip).toBeVisible()
        const actions = tooltip.locator('.actions, .action-container, .action-item, .action-label, [role="button"], button')
        await expect(actions.first()).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to check that hover has actions`)
      }
    },
  }
}
