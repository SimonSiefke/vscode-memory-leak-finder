import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async hide() {
      try {
        const sideBar = page.locator('.part.sidebar')
        const isVisible = await sideBar.isVisible()
        if (!isVisible) {
          return
        }
        await expect(sideBar).toBeVisible()
        await this.toggle()
        await expect(sideBar).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide side bar`)
      }
    },
    async hideSecondary() {
      try {
        const secondarySideBar = page.locator('.auxiliarybar')
        const isVisible = await secondarySideBar.isVisible()
        if (!isVisible) {
          return
        }
        await expect(secondarySideBar).toBeVisible()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.HideSecondarySideBar)
        await expect(secondarySideBar).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide secondary bar`)
      }
    },
    async moveLeft() {
      try {
        await page.waitForIdle()
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toHaveClass('right')
        await this.togglePosition()
        await expect(sideBar).toHaveClass('left')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to move side bar left`)
      }
    },
    async moveRight() {
      try {
        await page.waitForIdle()
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toHaveClass('left')
        await this.togglePosition()
        await expect(sideBar).toHaveClass('right')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to move side bar right`)
      }
    },
    async show() {
      try {
        const sideBar = page.locator('.part.sidebar')
        const isVisible = await sideBar.isVisible()
        if (isVisible) {
          await expect(sideBar).toBeVisible()
          await page.waitForIdle()
          return
        }
        await expect(sideBar).toBeHidden()
        await this.toggle()
        await expect(sideBar).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show side bar`)
      }
    },
    async toggle() {
      try {
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarVisibility)
      } catch (error) {
        throw new VError(error, `Failed to toggle side bar`)
      }
    },
    async togglePosition() {
      const quickPick = QuickPick.create({
        electronApp,
        expect,
        ideVersion,
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarPosition)
    },
    async shouldBeHidden() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify that side bar is hidden`)
      }
    },
    async shouldBeLeft() {
      try {
        const sideBar = page.locator('.part.sidebar')
        const className = await sideBar.getAttribute('class')
        if (!className || !className.includes('left')) {
          throw new Error(`Expected side bar to be on the left but got class "${className}"`)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify that side bar is on the left`)
      }
    },
    async shouldBeRight() {
      try {
        const sideBar = page.locator('.part.sidebar')
        const className = await sideBar.getAttribute('class')
        if (!className || !className.includes('right')) {
          throw new Error(`Expected side bar to be on the right but got class "${className}"`)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify that side bar is on the right`)
      }
    },
    async shouldBeVisible() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify that side bar is visible`)
      }
    },
  }
}
