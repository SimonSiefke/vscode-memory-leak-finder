import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true

export const setup = async (context: TestContext): Promise<void> => {
  const { Workspace } = context
  await PythonDevelopment.setup({
    ...context,
    Workspace: {
      ...Workspace,
      async setFiles(files: Array<{ name: string; content: string }>) {
        await Workspace.setFiles(
          files.map((file) => {
            if (file.name !== '.vscode/settings.json') return file
            const settings = JSON.parse(file.content)
            settings['python.useEnvironmentsExtension'] = false
            settings['python.experiments.enabled'] = false
            return { ...file, content: JSON.stringify(settings) }
          }),
        )
      },
    },
  })
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Panel, QuickPick, Terminal, Workspace } = context
  await Workspace.remove('.python-run.json')
  await Editor.open('run.py')
  try {
    await QuickPick.waitForCommand('Python: Start Terminal REPL')
    await QuickPick.executeCommand('Python: Start Terminal REPL', { pressKeyOnce: true })
    await Terminal.shouldContainText('>>>')
    await Terminal.show()
    await Terminal.execute("exec(open('run.py').read())")
    await Terminal.shouldContainText('Python calculation: 42')
    await PythonDevelopment.shouldHaveRunResult(context)
  } finally {
    await Terminal.killAll()
    await Panel.hide()
    await Editor.closeAll()
  }
}

export const teardown = PythonDevelopment.teardown
