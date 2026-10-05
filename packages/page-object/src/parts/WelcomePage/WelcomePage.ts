import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Editor from '../Editor/Editor.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const welcomePage = {
    async checkStepByIndex(index: number) {
      try {
        const step = this.getStepByIndex(index)
        await expect(step).toBeVisible()
        const checkbox = this.getStepCheckbox(step)
        await expect(checkbox).toBeVisible()
        await page.waitForIdle()
        const checkedValue = await checkbox.getAttribute('aria-checked')
        if (checkedValue !== 'true') {
          await checkbox.click()
          await page.waitForIdle()
        }
        await expect(checkbox).toHaveAttribute('aria-checked', 'true')
      } catch (error) {
        throw new VError(error, `Failed to check step at index ${index}`)
      }
    },
    async collapseStepByIndex(index: number) {
      try {
        const step = this.getStepByIndex(index)
        await expect(step).toBeVisible()
        const expanded = await step.getAttribute('aria-expanded')
        if (expanded !== 'false') {
          await step.click()
          await page.waitForIdle()
        }
        await expect(step).toHaveAttribute('aria-expanded', 'false')
      } catch (error) {
        throw new VError(error, `Failed to collapse step at index ${index}`)
      }
    },
    async expandStep(name: string) {
      try {
        const step = this.getStepByName(name)
        const expanded = await step.getAttribute('aria-expanded')
        if (expanded !== 'true') {
          await step.click()
          await page.waitForIdle()
        }
        await expect(step).toHaveAttribute('aria-expanded', 'true')
      } catch (error) {
        throw new VError(error, `Failed to expand step ${name}`)
      }
    },
    async expandStepByIndex(index: number) {
      try {
        const step = this.getStepByIndex(index)
        await expect(step).toBeVisible()
        const expanded = await step.getAttribute('aria-expanded')
        if (expanded !== 'true') {
          await step.click()
          await page.waitForIdle()
        }
        await expect(step).toHaveAttribute('aria-expanded', 'true')
      } catch (error) {
        throw new VError(error, `Failed to expand step at index ${index}`)
      }
    },
    getAllSteps() {
      return page.locator('.getting-started-step')
    },
    async getFundamentalsStepCount() {
      try {
        const steps = this.getAllSteps()
        await expect(steps.first()).toBeVisible()
        return steps.count()
      } catch (error) {
        throw new VError(error, `Failed to get fundamentals step count`)
      }
    },
    getStepByIndex(index: number) {
      return this.getAllSteps().nth(index)
    },
    getStepByName(name: string) {
      return page.locator(`.getting-started-step[data-step-id="${name}"]`)
    },
    getStepCheckbox(step: ReturnType<typeof page.locator>) {
      return step.locator('.monaco-custom-toggle, [role="checkbox"][aria-checked]').first()
    },
    async hide() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeVisible()
        const editor = Editor.create({ electronApp, expect, ideVersion, page, platform, VError })
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
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
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
        const heading = page.locator('.gettingStartedSlideDetails .category-title')
        const currentHeadingText = await heading.textContent().catch(() => '')
        if (!currentHeadingText || !/Learn the Fundamentals/i.test(currentHeadingText)) {
          const fundamentalsButton = page.locator('.gettingStartedSlideCategories .getting-started-category', {
            hasText: /Learn the Fundamentals/i,
          })
          const fundamentalsButtonCount = await fundamentalsButton.count()
          if (fundamentalsButtonCount > 0) {
            await fundamentalsButton.click()
            await page.waitForIdle()
          } else {
            const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
            await quickPick.showCommands()
            await quickPick.type('welcome open walkthrough')
            await quickPick.select('Welcome: Open Walkthrough...', true)
            await quickPick.select('Learn the Fundamentals')
            await page.waitForIdle()
          }
        }
        await expect(heading).toBeVisible()
        await page.waitForIdle()
        await expect(heading).toHaveText(/Learn the Fundamentals/i)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to fundamentals page`)
      }
    },
    async uncheckStepByIndex(index: number) {
      try {
        const step = this.getStepByIndex(index)
        await expect(step).toBeVisible()
        const checkbox = this.getStepCheckbox(step)
        await expect(checkbox).toBeVisible()
        await page.waitForIdle()
        const checkedValue = await checkbox.getAttribute('aria-checked')
        if (checkedValue !== 'false') {
          await checkbox.click()
          await page.waitForIdle()
        }
        await expect(checkbox).toHaveAttribute('aria-checked', 'false')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to uncheck step at index ${index}`)
      }
    },
  }

  return welcomePage
}
