import * as Editor from '../Editor/Editor.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.HelpWelcome)
        await expect(gettingStartedContainer).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show welcome page`)
      }
    },
    async showFundamentals() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeVisible()
        const fundamentalsButton = page.locator('.getting-started-category')
        await fundamentalsButton.click()
        await page.waitForIdle()
        const heading = page.locator('.category-title')
        await expect(heading).toBeVisible()
        await expect(heading).toHaveText('Get Started with VS Code')
      } catch (error) {
        throw new VError(error, `Failed to fundamentals page`)
      }
    },
    async expandStep(name) {
      try {
        const step = page.locator(`.getting-started-step[data-step-id="${name}"]`)
        await expect(step).toHaveAttribute('aria-expanded', 'false')
        await step.click()
        await expect(step).toHaveAttribute('aria-expanded', 'true')
      } catch (error) {
        throw new VError(error, `Failed to expand step ${name}`)
      }
    },
    async hide() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeVisible()
        const editor = Editor.create({ expect, page, VError })
        await editor.closeAll()
        await expect(gettingStartedContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide welcome page`)
      }
    },
  }
}
