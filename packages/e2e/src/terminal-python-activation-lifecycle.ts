import assert from 'node:assert/strict'
import { readFile, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import * as RunFile from './terminal-python-run-file.ts'
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
            if (file.name === '.vscode/settings.json') {
              const settings = JSON.parse(file.content)
              settings['python.terminal.activateEnvironment'] = true
              settings['python.useEnvironmentsExtension'] = false
              settings['python.experiments.enabled'] = false
              return { ...file, content: JSON.stringify(settings) }
            }
            if (file.name === 'run.py') {
              return {
                ...file,
                content: file.content.replace(
                  '"prefix": sys.prefix',
                  '"prefix": sys.prefix, "activation": __import__("os").environ.get("VIRTUAL_ENV")',
                ),
              }
            }
            return file
          }),
        )
      },
    },
  })
}

export const run = async (context: TestContext): Promise<void> => {
  await RunFile.run(context)
  const result = JSON.parse(await readFile(join(context.Workspace.getWorkspacePath(), '.python-run.json'), 'utf8'))
  assert.equal(typeof result.activation, 'string', 'The terminal did not activate the private environment')
  assert.equal(await realpath(result.activation), await realpath(join(context.Workspace.getWorkspacePath(), '.venv')))
}

export const teardown = PythonDevelopment.teardown
