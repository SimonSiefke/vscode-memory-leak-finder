import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const executeDeveloperCommand = async (command: string, errorMessage: string) => {
    try {
      await page.waitForIdle()
      const quickPick = QuickPick.create({
        electronApp,
        expect,
        ideVersion,
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(command)
      await page.waitForIdle()
    } catch (error) {
      throw new VError(error, errorMessage)
    }
  }

  return {
    async startTracing() {
      await executeDeveloperCommand(WellKnownCommands.StartTracing, `Failed to start tracing`)
      const statusBarItem = page.locator('[aria-label^="Recording performance trace."]')
      await expect(statusBarItem).toBeVisible()
      await page.waitForIdle()
    },
    async stopTracing() {
      await executeDeveloperCommand(WellKnownCommands.StopTracing, `Failed to stop tracing`)
    },
    async toggleProcessExplorer() {
      await executeDeveloperCommand(WellKnownCommands.ToggleProcessExplorer, `Failed to toggle process explorer`)
    },
    async toggleScreenCastMode() {
      await executeDeveloperCommand(WellKnownCommands.ToggleScreenCastMode, `Failed to toggle screencast mode`)
    },
  }
}
