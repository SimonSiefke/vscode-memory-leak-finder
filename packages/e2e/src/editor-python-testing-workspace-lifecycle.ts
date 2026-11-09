import assert from 'node:assert/strict'
import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import * as TerminalRepl from './terminal-python-repl-lifecycle.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true
let anchor = ''
let churn = ''
let anchorAdded = false

const addFolder = async (context: TestContext, directory: string): Promise<void> => {
  const { Electron, Explorer, QuickPick } = context
  await Electron.mockOpenDialog({ canceled: false, filePaths: [directory] })
  try {
    await QuickPick.executeCommand('Workspaces: Add Folder to Workspace...', { pressKeyOnce: true })
    await QuickPick.executeCommand('View: Show Explorer', { pressKeyOnce: true })
    await Explorer.shouldHaveItem(basename(directory))
  } finally {
    await Electron.unmockElectron('dialog', 'showOpenDialog')
  }
}

const removeFolder = async (context: TestContext, directory: string): Promise<void> => {
  const { QuickPick } = context
  await QuickPick.executeCommand('Workspaces: Remove Folder from Workspace...', { pressKeyOnce: true, stayVisible: true })
  await QuickPick.select(basename(directory))
}

export const setup = async (context: TestContext): Promise<void> => {
  anchorAdded = false
  anchor = ''
  churn = ''
  await TerminalRepl.setup(context)
  await context.Workspace.updateWorkspaceSettings({
    'python.testing.unittestEnabled': false,
    'python.testing.pytestEnabled': false,
    'python.testing.autoTestDiscoverOnSaveEnabled': false,
  })
  const root = context.Workspace.getWorkspacePath()
  anchor = `${root}-python-anchor`
  churn = `${root}-python-churn`
  for (const directory of [anchor, churn]) {
    await rm(directory, { recursive: true, force: true })
    await mkdir(join(directory, '.vscode'), { recursive: true })
  }
  await writeFile(
    join(anchor, '.vscode/settings.json'),
    JSON.stringify({
      'python.testing.unittestEnabled': false,
      'python.testing.pytestEnabled': false,
      'python.testing.autoTestDiscoverOnSaveEnabled': false,
      'python.useEnvironmentsExtension': false,
    }),
  )
  await writeFile(
    join(churn, '.vscode/settings.json'),
    JSON.stringify({
      'python.defaultInterpreterPath': PythonDevelopment.interpreter(context),
      'python.testing.unittestEnabled': true,
      'python.testing.pytestEnabled': false,
      'python.testing.unittestArgs': ['-v', '-s', '.', '-p', 'churn_test.py'],
      'python.testing.autoTestDiscoverOnSaveEnabled': true,
      'python.testing.autoTestDiscoverOnSavePattern': join(churn, '*.py'),
      'python.useEnvironmentsExtension': false,
      'python.experiments.enabled': false,
    }),
  )
  await writeFile(
    join(churn, 'churn_test.py'),
    [
      'import json, os, sys, unittest',
      'from pathlib import Path',
      'Path(sys.prefix).parent.joinpath(".python-workspace-discovered.json").write_text(json.dumps({"pid": os.getpid(), "prefix": sys.prefix, "module": __file__}))',
      'class ChurnTests(unittest.TestCase):',
      '    def test_total(self):',
      '        self.assertEqual(sum((20, 22)), 42)',
      '',
    ].join('\n'),
  )
  await addFolder(context, anchor)
  anchorAdded = true
  await context.Editor.open('run.py')
  await context.RunningExtensions.showAndWaitFor('Python')
  await context.RunningExtensions.showAndWaitFor('Pylance')
  await context.Editor.closeAll()
  await context.SideBar.hide()
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Output, Panel, QuickPick, SideBar, Workspace } = context
  await Workspace.remove('.python-workspace-discovered.json')
  await addFolder(context, churn)
  try {
    await QuickPick.executeCommand('Output: Focus on Output View', { pressKeyOnce: true })
    await Output.select('Python')
    await QuickPick.executeCommand('View: Clear Output', { pressKeyOnce: true })
    await Panel.hide()
    await Editor.open('churn_test.py')
    await Editor.press('Control+End')
    await Editor.type('# Workspace development edit\n')
    await Workspace.remove('.python-workspace-discovered.json')
    await Editor.save({ viaKeyBoard: true })
    await QuickPick.executeCommand('Output: Focus on Output View', { pressKeyOnce: true })
    await Output.select('Python')
    assert(await Workspace.waitForFile('.python-workspace-discovered.json'))
    const discovery = JSON.parse(await readFile(join(Workspace.getWorkspacePath(), '.python-workspace-discovered.json'), 'utf8'))
    assert.equal(typeof discovery.pid, 'number')
    assert.equal(await realpath(discovery.module), await realpath(join(churn, 'churn_test.py')))
    assert.equal(await realpath(discovery.prefix), await realpath(join(Workspace.getWorkspacePath(), '.venv')))
    await Output.shouldHaveText(/Unittest\s+discovery\s+completed/)
  } finally {
    await Editor.closeAll()
    await removeFolder(context, churn)
    await SideBar.hide()
    await Panel.hide()
  }
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    if (anchorAdded) await removeFolder(context, anchor)
  } finally {
    await PythonDevelopment.teardown(context)
    await context.Workspace.remove('.python-workspace-discovered.json')
    for (const directory of [anchor, churn]) if (directory) await rm(directory, { recursive: true, force: true })
  }
}
