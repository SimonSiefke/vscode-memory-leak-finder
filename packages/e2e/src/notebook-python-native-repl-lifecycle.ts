import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import * as TerminalRepl from './terminal-python-repl-lifecycle.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true
export const setup = TerminalRepl.setup

export const run = async ({ Editor, Notebook, QuickPick }: TestContext): Promise<void> => {
  await Editor.open('run.py')
  try {
    await QuickPick.waitForCommand('Python: Start Native Python REPL')
    await QuickPick.executeCommand('Python: Start Native Python REPL', { pressKeyOnce: true })
    await Notebook.shouldHaveKernel('Python REPL')
    await Notebook.focusReplInput()
    await Editor.type('print(sum((20, 22)))')
    await Editor.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter')
    await Notebook.shouldHaveOutput('42\n')
  } finally {
    await QuickPick.executeCommand('View: Revert and Close Editor', { pressKeyOnce: true })
    await Editor.closeAll()
  }
}

export const teardown = PythonDevelopment.teardown
