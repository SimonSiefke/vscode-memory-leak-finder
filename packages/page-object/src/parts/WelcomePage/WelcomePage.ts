import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as Editor from '../Editor/Editor.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, platform, VError }: CreateParams.CreateParams) => {
  return {
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
        const editor = Editor.create({ expect, ideVersion, page, platform, VError })
        await editor.closeAll()
        await expect(gettingStartedContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide welcome page`)
      }
    },
    async show() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeHidden()
        const quickPick = QuickPick.create({ expect, ideVersion, page, platform, VError })
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
        await expect(heading).toHaveText(/Get Started with VS Code/i)
      } catch (error) {
        throw new VError(error, `Failed to fundamentals page`)
      }
    },
  }
}
