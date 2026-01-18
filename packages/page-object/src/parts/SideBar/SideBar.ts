import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
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
        const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
        await quickPick.executeCommand(WellKnownCommands.HideSecondarySideBar)
        await expect(secondarySideBar).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide secondary bar`)
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
    async toggle() {
      try {
        const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
        await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarVisibility)
      } catch (error) {
        throw new VError(error, `Failed to toggle side bar`)
      }
    },
    async togglePosition() {
      const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
      await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarPosition)
    },
  }
}
