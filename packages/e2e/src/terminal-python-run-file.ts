import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true
export const setup = PythonDevelopment.setup

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Panel, QuickPick, Terminal, Workspace } = context
  await Workspace.remove('.python-run.json')
  await Editor.open('run.py')
  try {
    await QuickPick.waitForCommand('Python: Run Python File in Terminal')
    await QuickPick.executeCommand('Python: Run Python File in Terminal')
    await Terminal.shouldContainText('Python calculation: 42')
    await PythonDevelopment.shouldHaveRunResult(context)
  } finally {
    await Terminal.killAll()
    await Panel.hide()
    await Editor.closeAll()
  }
}

export const teardown = PythonDevelopment.teardown
