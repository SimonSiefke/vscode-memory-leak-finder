import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async continue() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const continueButton = debugToolBar.locator('[aria-label^="Continue"]')
        await expect(continueButton).toBeVisible()
        await continueButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to continue`)
      }
    },
    async pause() {
      try {
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        const pauseButton = debugToolBar.locator('[aria-label^="Pause"]')
        await expect(pauseButton).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
        await quickPick.executeCommand(WellKnownCommands.DebugPause)
        await page.waitForIdle()
        await expect(pauseButton).toBeHidden({
          timeout: 30_000,
        })
        const continueButton = debugToolBar.locator('[aria-label^="Continue"]')
        await expect(continueButton).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to pause`)
      }
    },
    async removeAllBreakpoints() {
      try {
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.RemoveAllBreakpoints)
      } catch (error) {
        throw new VError(error, `Failed to remove all breakpoints`)
      }
    },
    async runAndWaitForDebugConsoleOutput({ debugConfiguration, debugLabel, output }) {
      try {
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ShowRunAndDebug)
        await page.waitForIdle()
        await this.startRunAndDebug({
          debugConfiguration,
          debugLabel,
        })
        if (output) {
          await this.waitForDebugConsoleOutput({ output })
        }
      } catch (error) {
        throw new VError(error, `Failed to run debugger`)
      }
    },
    async runAndWaitForPaused({ callStackSize, debugConfiguration, debugLabel, file, hasCallStack, line, viaIcon }) {
      try {
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ShowRunAndDebug)
        await page.waitForIdle()
        await this.startRunAndDebug({ debugConfiguration, debugLabel, viaIcon })
        await this.waitForPaused({ callStackSize, file, hasCallStack, line })
      } catch (error) {
        throw new VError(error, `Failed to run debugger`)
      }
    },
    async setPauseOnExceptions({ pauseOnCaughtExceptions, pauseOnExceptions }) {
      try {
        await page.waitForIdle()
        const breakpoints = page.locator('.debug-breakpoints')
        await expect(breakpoints).toBeVisible()
        const exception = breakpoints.locator('[aria-label="Caught Exceptions"] input[type="checkbox"]')
        await expect(exception).toBeVisible()
        const uncaughtException = breakpoints.locator('[aria-label="Uncaught Exceptions"] input[type="checkbox"]')
        await expect(uncaughtException).toBeVisible()

        await exception.setChecked(pauseOnExceptions)
        await uncaughtException.setChecked(pauseOnCaughtExceptions)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set pause on exceptions`)
      }
    },
    async setValue({
      newVariableValue,
      scopeName = 'Scope Module',
      variableName,
      variableValue,
    }: {
      variableName: string
      variableValue: string
      newVariableValue: string
      scopeName: string
    }) {
      try {
        const debugVariables = page.locator('.debug-variables')
        const scope = debugVariables.locator(`[aria-label="${scopeName}"]`)
        await expect(scope).toBeVisible()
        const isExpanded = await scope.getAttribute('aria-expanded')
        if (isExpanded === 'false') {
          const scopeModuleText = scope.locator('.monaco-highlighted-label')
          await scopeModuleText.click()
        }
        await expect(scope).toHaveAttribute('aria-expanded', 'true')
        const variableRow = debugVariables.locator(`[aria-label="${variableName}, value ${variableValue}"]`)
        await variableRow.dblclick()
        const input = page.locator('input[aria-label="Type new variable value"]')
        await expect(input).toBeVisible()
        await expect(input).toHaveValue(variableValue)
        await input.type(newVariableValue)
        await input.blur()
        await expect(input).toBeHidden()
        const newVariableRow = debugVariables.locator(`[aria-label="${variableName}, value ${newVariableValue}"]`)
        await expect(newVariableRow).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to set variable value for ${variableName}`)
      }
    },
    async startRunAndDebug({ debugConfiguration = '', debugLabel = 'Node.js', viaIcon = false } = {}) {
      try {
        if (viaIcon) {
          const icon = page.locator('.codicon-debug-start')
          await expect(icon).toBeVisible()
          await page.waitForIdle()
          await icon.click()
          await page.waitForIdle()
        } else {
          await page.waitForIdle()
          const button = page.locator('.monaco-button:has-text("Run and Debug")')
          await expect(button).toBeVisible()
          await page.waitForIdle()
          await button.click()
        }
        await page.waitForIdle()
        const quickPickWidget = page.locator('.quick-input-widget')
        const quickPickPromise = expect(quickPickWidget)
          .toBeVisible({
            timeout: 15_000,
          })
          .then(() => 1)
          .catch(() => 0)
        const debugToolBar = page.locator('.debug-toolbar')
        const debugToolBarPromise = expect(debugToolBar)
          .toBeVisible({
            timeout: 15_000,
          })
          .then(() => 2)
          .catch(() => 0)
        const value = await Promise.race([quickPickPromise, debugToolBarPromise])
        if (value === 1) {
          const option = page.locator(`[role="option"][aria-label^="${debugLabel}"]`)
          await expect(quickPickWidget).toBeVisible()

          await page.waitForIdle()
          await option.click()
          await page.waitForIdle()

          if (debugConfiguration) {
            const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
            await quickPick.select(debugConfiguration)
            await page.waitForIdle()
          }
        }
        await expect(debugToolBar).toBeVisible({
          timeout: 30_000,
        })

        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to start run and debug`)
      }
    },
    async step({
      callStackSize: callStackSize,
      file: file,
      hasCallStack = true,
      line: line,
    }: {
      file: string
      line: number
      callStackSize: number
      hasCallStack?: boolean
    }) {
      try {
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.DebugStepOver)
        await page.waitForIdle()
        await this.waitForPaused({
          callStackSize: callStackSize,
          file: file,
          hasCallStack,
          line: line,
        })
      } catch (error) {
        throw new VError(error, `Failed to step over`)
      }
    },
    async stepInto({
      expectedCallStackSize,
      expectedFile,
      expectedPauseLine,
      hasCallStack,
    }: {
      expectedFile: string
      expectedPauseLine: number
      expectedCallStackSize: number
      hasCallStack: boolean
    }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.DebugStepInto, {
          pressKeyOnce: true,
        })
        await page.waitForIdle()
        await this.waitForPaused({
          callStackSize: expectedCallStackSize,
          file: expectedFile,
          hasCallStack,
          line: expectedPauseLine,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to step into`)
      }
    },
    async stepOutOf({
      expectedCallStackSize,
      expectedFile,
      expectedPauseLine,
      hasCallStack,
    }: {
      expectedFile: string
      expectedPauseLine: number
      expectedCallStackSize: number
      hasCallStack: boolean
    }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.DebugStepOut, {
          pressKeyOnce: true,
        })
        await page.waitForIdle()
        await this.waitForPaused({
          callStackSize: expectedCallStackSize,
          file: expectedFile,
          hasCallStack,
          line: expectedPauseLine,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to step out`)
      }
    },
    async stop() {
      try {
        await page.waitForIdle()
        const debugToolBar = page.locator('.debug-toolbar')
        await expect(debugToolBar).toBeVisible()
        await page.waitForIdle()
        const stopButton = debugToolBar.locator('[aria-label^="Stop"]')
        await expect(stopButton).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
        await quickPick.executeCommand(WellKnownCommands.DebugStop)
        await expect(stopButton).toBeHidden({
          timeout: 5000,
        })
        await expect(debugToolBar).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to stop`)
      }
    },
    async waitForDebugConsoleOutput({ output }) {
      try {
        await page.waitForIdle()
        const repl = page.locator('.repl')
        await expect(repl).toBeVisible()
        await page.waitForIdle()
        const row = page.locator('.monaco-list-row[aria-label^="x = 1"]')
        await expect(row).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to wait for debug console output`)
      }
    },
    async waitForPaused({ callStackSize, file, hasCallStack = true, line }) {
      await page.waitForIdle()
      const continueButton = page.locator('.debug-toolbar .codicon-debug-continue')
      await expect(continueButton).toBeVisible({ timeout: 30_000 })
      await page.waitForIdle()
      if (!hasCallStack) {
        // TODO maybe check some other things
        return
      }
      const pausedStackFrame = page.locator('.debug-top-stack-frame-column')
      await expect(pausedStackFrame).toBeVisible()
      await page.waitForIdle()
      const debugCallStack = page.locator('.debug-call-stack')
      await expect(debugCallStack).toBeVisible()
      await page.waitForIdle()
      const sessionLabel = debugCallStack.locator('.state.label')
      await expect(sessionLabel).toBeVisible()
      await expect(sessionLabel).toHaveText(/Paused/)
      await page.waitForIdle()
      const stackFrame = page.locator('.debug-call-stack .monaco-list-row.selected')
      await expect(stackFrame).toBeVisible()
      await expect(stackFrame).toHaveAttribute('aria-label', `Stack Frame <anonymous>, line ${line}, ${file}`)
      if (callStackSize) {
        await expect(stackFrame).toHaveAttribute(`aria-setsize`, `${callStackSize}`)
      }
      await page.waitForIdle()
      const cursor = page.locator('.part.editor .monaco-editor .cursor')
      await expect(cursor).toBeVisible()
      if (line === 4) {
        // TODO compute this dynamically
        await expect(cursor).toHaveCss('top', '57px')
      }
      const editor = page.locator('.part.editor [role="textbox"][aria-roledescription="editor"]')
      await expect(editor).toBeFocused()
      await page.waitForIdle()
    },
    async waitForPausedOnException({ exception = false, file, line }) {
      await page.waitForIdle()
      const continueButton = page.locator('.debug-toolbar .codicon-debug-continue')
      await expect(continueButton).toBeVisible({ timeout: 30_000 })
      await page.waitForIdle()
      const pausedStackFrame = page.locator('.debug-top-stack-frame-column')
      await expect(pausedStackFrame).toBeVisible()
      await page.waitForIdle()
      const debugCallStack = page.locator('.debug-call-stack')
      await expect(debugCallStack).toBeVisible()
      await page.waitForIdle()
      const sessionLabel = debugCallStack.locator('.state.label')
      await expect(sessionLabel).toBeVisible()
      await expect(sessionLabel).toHaveText(/Paused/)
      await page.waitForIdle()
      const stackFrame = page.locator('.debug-call-stack .monaco-list-row.selected')
      await expect(stackFrame).toBeVisible()
      await expect(stackFrame).toHaveAttribute('aria-label', `Stack Frame <anonymous>, line ${line}, ${file}`)
      await page.waitForIdle()
      if (exception) {
        const widget = page.locator('.exception-widget')
        await expect(widget).toBeVisible()
        await page.waitForIdle()
        await expect(widget).toBeFocused()
      } else {
        const cursor = page.locator('.part.editor .monaco-editor .cursor')
        await expect(cursor).toBeVisible()
        const editor = page.locator('.part.editor [role="textbox"][aria-roledescription="editor"]')
        await expect(editor).toBeFocused()
      }
      await page.waitForIdle()
    },
  }
}
