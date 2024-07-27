import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as ContextMenu from '../ContextMenu/ContextMenu.js'
import * as IsMacos from '../IsMacos/IsMacos.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      const quickPick = QuickPick.create({
        page,
        expect,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ShowRunningExtensions)
      const tabLabel = page.locator('.tab-label[aria-label="Running Extensions"]')
      await expect(tabLabel).toBeVisible()
      const gitExtension = page.locator('.editor-container .extension .name', {
        hasExactText: 'Git',
      })
      await expect(gitExtension).toBeVisible()
    },
    async startDebuggingExtensionHost() {
      try {
        const actionLabel = page.locator('.action-label[aria-label="Start Debugging Extension Host"]')
        await expect(actionLabel).toBeVisible()
        await actionLabel.click()
      } catch (error) {
        throw new VError(error, `Failed to start debugging extension host`)
      }
    },
  }
}
