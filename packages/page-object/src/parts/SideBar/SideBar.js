import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarVisibility)
      } catch (error) {
        throw new VError(error, `Failed to show side bar`)
      }
    },
    async show() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeHidden()
        await this.toggle()
        await expect(sideBar).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show side bar`)
      }
    },
    async hide() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeVisible()
        await this.toggle()
        await expect(sideBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide side bar`)
      }
    },
    async togglePosition() {
      const quickPick = QuickPick.create({ expect, page, VError })
      await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarPosition)
      await quickPick.select('View: Toggle Primary Side Bar Position')
    },
    async moveRight() {
      try {
        const sideBar = page.locator('.part.sidebar')
        await expect(sideBar).toBeVisible()
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
        await expect(sideBar).toBeVisible()
        await expect(sideBar).toHaveClass('right')
        await this.togglePosition()
        await expect(sideBar).toHaveClass('left')
      } catch (error) {
        throw new VError(error, `Failed to move side bar left`)
      }
    },
  }
}
