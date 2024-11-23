import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarVisibility)
      } catch (error) {
        throw new VError(error, `Failed to toggle side bar`)
      }
    },
    async show() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeHidden()
        await this.toggle()
        await expect(sideBar).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show side bar`)
      }
    },
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
    async togglePosition() {
      const quickPick = QuickPick.create({ expect, page, VError })
      await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarPosition)
    },
    async moveRight() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toHaveClass('left')
        await this.togglePosition()
        await expect(sideBar).toHaveClass('right')
      } catch (error) {
        throw new VError(error, `Failed to move side bar right`)
      }
    },
    async moveLeft() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toHaveClass('right')
        await this.togglePosition()
        await expect(sideBar).toHaveClass('left')
      } catch (error) {
        throw new VError(error, `Failed to move side bar left`)
      }
    },
  }
}
