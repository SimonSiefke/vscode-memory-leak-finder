import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import * as Completion from './editor-python-project-completion.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true

export const setup = (context: TestContext): Promise<void> => PythonDevelopment.setup(context, { extraFiles: ['completion.py'] })

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Output, Panel, QuickPick, Workbench, Workspace } = context
  const settings = JSON.parse(await readFile(join(Workspace.getWorkspacePath(), '.vscode/settings.json'), 'utf8'))
  try {
    await Output.show()
    await Output.select('Python Language Server')
    await QuickPick.executeCommand('View: Clear Output', { pressKeyOnce: true })
    await Output.select('Python')
    await QuickPick.executeCommand('View: Clear Output', { pressKeyOnce: true })
    await Workspace.writeWorkspaceSettings({ ...settings, 'python.languageServer': 'None' })
    await Output.filter('None')
    const output = await Workbench.evaluate({ expression: 'document.querySelector(".pane-body.output-view .view-lines")?.textContent' })
    assert.match(String(output), /language\s+server\s+is\s+set\s+to\s+None/)
    await Output.clearFilter()
    await Workspace.writeWorkspaceSettings({ ...settings, 'python.languageServer': 'Pylance' })
    await Output.select('Python Language Server')
    await Output.filter('Found', { timeout: 30_000 })
    const restartedOutput = await Workbench.evaluate({
      expression: 'document.querySelector(".pane-body.output-view .view-lines")?.textContent',
    })
    assert.match(String(restartedOutput), /Found\s+\d+\s+source\s+files/)
    await Output.clearFilter()
    await Panel.hide()
    await Completion.run(context)
  } finally {
    await Workspace.writeWorkspaceSettings(settings)
    await Editor.closeAll()
    await Panel.hide()
  }
}

export const teardown = PythonDevelopment.teardown
