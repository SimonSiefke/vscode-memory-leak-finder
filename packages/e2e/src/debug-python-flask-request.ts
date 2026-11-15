import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true

export const setup = async (context: TestContext): Promise<void> => {
  await PythonDevelopment.setup(context, { flask: true })
  await context.RunAndDebug.removeAllBreakpoints()
}

export const run = async (context: TestContext): Promise<void> => {
  const { ActivityBar, DebugConsole, Editor, Panel, QuickPick, RunAndDebug, SideBar, Terminal, Workspace } = context
  await Workspace.remove('.flask-port')
  await Workspace.remove('.flask-response.json')
  await Editor.open('app.py')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(11)
  try {
    await QuickPick.executeCommand('Debug: Start Debugging')
    assert.equal(await Workspace.waitForFile('.flask-port'), true, 'Flask server did not start')
    await PythonDevelopment.startScript(context, 'request_client.py')
    await RunAndDebug.waitForPaused({ file: 'app.py', line: 11, hasCallStack: false })
    await DebugConsole.show()
    await DebugConsole.clear()
    await DebugConsole.evaluate({ expression: 'amount', expectedResult: { message: '42' }, hasSuggest: false })
    await DebugConsole.clear()
    await DebugConsole.evaluate({ expression: 'name', expectedResult: { message: /^['"]e2e['"]$/ }, hasSuggest: false })
    await DebugConsole.clear()
    await RunAndDebug.continue()
    await Terminal.show()
    await Terminal.shouldContainText('Flask response: 42')
    assert.equal(await Workspace.waitForFile('.flask-response.json'), true)
    const response = JSON.parse(await readFile(join(Workspace.getWorkspacePath(), '.flask-response.json'), 'utf8'))
    assert.deepEqual(response, { name: 'e2e', total: 42 })
  } finally {
    await PythonDevelopment.stopDebugging(context)
    await RunAndDebug.removeAllBreakpoints()
    await Terminal.killAll()
    await Editor.closeAll()
    await Panel.hide()
    await SideBar.hide()
    await Workspace.remove('.flask-port')
    await Workspace.remove('.flask-response.json')
  }
}

export const teardown = PythonDevelopment.teardown
