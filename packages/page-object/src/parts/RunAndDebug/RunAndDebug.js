import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async startRunAndDebug() {
      try {
        const button = page.locator('.monaco-button:has-text("Run and Debug")')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        const quickPickWidget = page.locator('.quick-input-widget')
        const quickPickPromise = expect(quickPickWidget)
          .toBeVisible()
          .then(() => 1)
        const debugToolBar = page.locator('.debug-toolbar')
        const debugToolBarPromise = expect(debugToolBar)
          .toBeVisible()
          .then(() => 2)
        const value = await Promise.race([quickPickPromise, debugToolBarPromise])
        if (value === 1) {
          const nodeJsOption = page.locator('[role="option"][aria-label="Node.js"]')
          await expect(quickPickWidget).toBeVisible()
          await nodeJsOption.click()
        }
        await expect(debugToolBar).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to start run and debug`)
      }
    },
    async pause() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const pauseButton = debugToolBar.locator('[aria-label^="Pause"]')
        await expect(pauseButton).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugPause)
        await page.waitForIdle()
        await expect(pauseButton).toBeHidden({
          timeout: 20_000,
        })
        const continueButton = debugToolBar.locator('[aria-label^="Continue"]')
        await expect(continueButton).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to pause`)
      }
    },
    async stop() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const stopButton = debugToolBar.locator('[aria-label^="Stop"]')
        await expect(stopButton).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugStop)
        await expect(stopButton).toBeHidden({
          timeout: 5000,
        })
        await expect(debugToolBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to stop`)
      }
    },
    async waitForPaused() {
      await page.waitForIdle()
      const continueButton = page.locator('.debug-toolbar .codicon-debug-continue')
      // TODO long timeout here
      await expect(continueButton).toBeVisible()
      await page.waitForIdle()
    },
    async runAndWaitForPaused() {
      try {
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ShowRunAndDebug)
        await this.startRunAndDebug()
        await this.waitForPaused()
      } catch (error) {
        throw new VError(error, `Failed to run debugger`)
      }
    },
    async removeAllBreakpoints() {
      try {
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.RemoveAllBreakpoints)
      } catch (error) {
        throw new VError(error, `Failed to remove all breakpoints`)
      }
    },
    async step(expectedFile, expectedPauseLine) {
      try {
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.DebugStepOver)
        await page.waitForIdle()
        await this.waitForPaused()
        const stackFrame = page.locator('.debug-call-stack .monaco-list-row.selected')
        await expect(stackFrame).toBeVisible()
        await expect(stackFrame).toHaveAttribute('aria-label', `Stack Frame <anonymous>, line ${expectedPauseLine}, ${expectedFile}`)
      } catch (error) {
        throw new VError(error, `Failed to step over`)
      }
    },
    async setValue(variableName, variableValue, newVariableValue) {
      try {
        const debugVariables = page.locator('.debug-variables')
        const scopeLocal = debugVariables.locator('[aria-label="Scope Local"]')
        await expect(scopeLocal).toBeVisible()
        const scopeModule = debugVariables.locator('[aria-label="Scope Module"]')
        await expect(scopeModule).toBeVisible()
        const isExpanded = await scopeModule.getAttribute('aria-expanded')
        if (isExpanded === 'false') {
          const scopeModuleText = scopeModule.locator('.monaco-highlighted-label')
          await scopeModuleText.click()
        }
        await expect(scopeModule).toHaveAttribute('aria-expanded', 'true')
        const variableRow = debugVariables.locator(`[aria-label="${variableName}, value ${variableValue}"]`)
        await variableRow.dblclick()
        const input = page.locator('input[aria-label="Type new variable value"]')
        await expect(input).toBeVisible()
        await expect(input).toHaveValue('1')
        await input.type(newVariableValue)
        await input.blur()
        await expect(input).toBeHidden()
        const newVariableRow = debugVariables.locator(`[aria-label="${variableName}, value ${newVariableValue}"]`)
        await expect(newVariableRow).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to set variable value for ${variableName}`)
      }
    },
  }
}
