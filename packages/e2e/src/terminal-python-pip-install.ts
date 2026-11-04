import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true

export const setup = (context: TestContext): Promise<void> => PythonDevelopment.setup(context, { flask: true })

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Panel, Terminal, Workspace } = context
  await Workspace.remove('.pip-result.json')
  await Editor.open('app.py')
  try {
    await PythonDevelopment.runScript(context, 'install_package.py', 'Flask installation verified: 42')
    assert.equal(await Workspace.waitForFile('.pip-result.json'), true)
    const result = JSON.parse(await readFile(join(Workspace.getWorkspacePath(), '.pip-result.json'), 'utf8'))
    assert.deepEqual(result, { version: '3.1.2', response: { name: 'e2e', total: 42 } })
  } finally {
    await Terminal.killAll()
    await Panel.hide()
    await Editor.closeAll()
  }
}

export const teardown = PythonDevelopment.teardown
