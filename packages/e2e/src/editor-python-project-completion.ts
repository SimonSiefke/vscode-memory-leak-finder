import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true

export const setup = (context: TestContext): Promise<void> => PythonDevelopment.setup(context, { extraFiles: ['completion.py'] })

export const run = async ({ Editor, QuickPick, Suggest }: TestContext): Promise<void> => {
  await Editor.open('completion.py')
  try {
    await Editor.setCursor(4, 1)
    await Editor.type('invoice.')
    await Suggest.open('total, Method')
    await Suggest.accept('total, Method')
    await Editor.shouldContainText('invoice.total')
  } finally {
    await Editor.press('Escape')
    await QuickPick.executeCommand('View: Revert and Close Editor')
  }
}

export const teardown = PythonDevelopment.teardown
