import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { TestContext } from '../types.ts'

const exec = promisify(execFile)
const fixtures = join(import.meta.dirname, '../fixtures/python-development')
const windows = process.platform === 'win32'

export const interpreter = (context: TestContext): string =>
  join(context.Workspace.getWorkspacePath(), '.venv', windows ? 'Scripts/python.exe' : 'bin/python')

const quote = (value: string): string => (windows ? `'${value.replaceAll("'", "''")}'` : `'${value.replaceAll("'", "'\\''")}'`)

export const startScript = async (context: TestContext, script: string, args: string[] = []): Promise<void> => {
  await context.Terminal.show()
  const command = `${windows ? '& ' : ''}${[interpreter(context), script, ...args].map(quote).join(' ')}`
  await context.Terminal.execute(command)
}

export const runScript = async (context: TestContext, script: string, output: string, args: string[] = []): Promise<void> => {
  await startScript(context, script, args)
  // The command contains only the script path; echoed input cannot satisfy this assertion.
  await context.Terminal.shouldContainText(output, 120_000)
}

const findPython = async (): Promise<string> => {
  const candidates = process.env.PYTHON_E2E_PYTHON ? [process.env.PYTHON_E2E_PYTHON] : windows ? ['python', 'py'] : ['python3', 'python']
  for (const command of candidates) {
    try {
      const { stdout } = await exec(command, [
        ...(command === 'py' ? ['-3'] : []),
        '-c',
        'import ensurepip, sys, venv; assert sys.version_info >= (3, 10); print(sys.executable)',
      ])
      return stdout.trim()
    } catch {
      // Try the next interpreter, including the Windows Python launcher.
    }
  }
  throw new Error('Python development scenarios require Python 3.10+ with venv and ensurepip; set PYTHON_E2E_PYTHON to its executable')
}

export const setup = async (
  context: TestContext,
  { flask = false, extraFiles = [] }: { flask?: boolean; extraFiles?: string[] } = {},
): Promise<void> => {
  const { Editor, Extensions, ExtensionDetailView, Panel, RunningExtensions, SideBar, Terminal, Workspace } = context
  const python = await findPython()
  await Editor.closeAllEditorGroups()
  await Terminal.killAll()
  const names = ['setup_environment.py', 'run.py', 'project/__init__.py', 'project/models.py', ...extraFiles]
  if (flask) names.push('requirements.txt', 'app.py', 'server.py', 'request_client.py', 'install_package.py')
  await Workspace.setFiles([
    ...(await Promise.all(names.map(async (name) => ({ name, content: await readFile(join(fixtures, name), 'utf8') })))),
    {
      name: '.vscode/settings.json',
      content: JSON.stringify({
        'python.defaultInterpreterPath': interpreter(context),
        'python.terminal.activateEnvironment': false,
        'python-envs.terminal.autoActivationType': 'off',
        'terminal.integrated.cwd': Workspace.getWorkspacePath(),
        'terminal.integrated.defaultProfile.windows': 'PowerShell',
        'editor.quickSuggestions': false,
        'editor.suggestOnTriggerCharacters': false,
        'editor.wordBasedSuggestions': 'off',
        'editor.inlineSuggest.enabled': false,
        'editor.autoClosingBrackets': 'never',
        'python.analysis.completeFunctionParens': false,
        'files.autoSave': 'off',
      }),
    },
    ...(flask
      ? [
          {
            name: '.vscode/launch.json',
            content: JSON.stringify({
              version: '0.2.0',
              configurations: [
                {
                  name: 'Flask request',
                  type: 'debugpy',
                  request: 'launch',
                  python: interpreter(context),
                  program: '${workspaceFolder}/server.py',
                  console: 'internalConsole',
                  justMyCode: true,
                },
              ],
            }),
          },
        ]
      : []),
  ])
  await Terminal.show()
  await Terminal.execute(`${windows ? '& ' : ''}${[python, 'setup_environment.py', ...(flask ? ['--flask'] : [])].map(quote).join(' ')}`)
  await Terminal.shouldContainText('Python development environment ready', 120_000)
  await Terminal.killAll()
  await Panel.hide()
  for (const extension of [
    { id: 'ms-python.python', name: 'Python' },
    { id: 'ms-python.vscode-pylance', name: 'Pylance' },
    ...(flask ? [{ id: 'ms-python.debugpy', name: 'Python Debugger' }] : []),
  ]) {
    await Extensions.show()
    await Extensions.search(`@id:${extension.id}`)
    await Extensions.first.shouldBe(extension.name)
    await Extensions.first.click()
    await ExtensionDetailView.installExtension()
    await ExtensionDetailView.enableExtension({ force: true })
    await SideBar.hide()
    await Editor.closeAll()
  }
  await Editor.open('models.py')
  await Editor.shouldHaveBreadCrumb('Invoice')
  await RunningExtensions.showAndWaitFor('Python')
  await RunningExtensions.showAndWaitFor('Pylance')
  await Editor.closeAll()
}

export const shouldHaveRunResult = async (context: TestContext): Promise<void> => {
  const { Workspace } = context
  assert.equal(await Workspace.waitForFile('.python-run.json'), true)
  const result = JSON.parse(await readFile(join(Workspace.getWorkspacePath(), '.python-run.json'), 'utf8'))
  assert.equal(result.total, 42)
  assert.equal(await realpath(result.prefix), await realpath(join(Workspace.getWorkspacePath(), '.venv')))
}

export const stopDebugging = async ({ RunAndDebug, Workbench }: TestContext): Promise<void> => {
  const running = await Workbench.evaluate({ expression: 'Boolean(document.querySelector(".debug-toolbar")?.checkVisibility())' })
  if (running) await RunAndDebug.stop()
}

export const teardown = async (context: TestContext): Promise<void> => {
  const { Editor, Panel, Terminal, Workspace } = context
  await stopDebugging(context)
  await Terminal.killAll()
  await Editor.closeAll()
  await Panel.hide()
  await Workspace.remove('.venv')
  await Workspace.remove('.wheels')
  await Workspace.remove('.vscode/settings.json')
}
