import assert from 'node:assert/strict'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import * as PythonDevelopment from '../helpers/pythonDevelopment.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const requiresNetwork = true
let iteration = 0
let unittestFolder = ''
let folderAdded = false

export const setup = async (context: TestContext): Promise<void> => {
  iteration = 0
  folderAdded = false
  unittestFolder = ''
  const { Editor, Electron, Explorer, QuickPick, RunningExtensions, SideBar, Workspace } = context
  await PythonDevelopment.setup(
    {
      ...context,
      Workspace: {
        ...Workspace,
        async setFiles(files: Array<{ name: string; content: string }>) {
          await Workspace.setFiles(
            files.map((file) => {
              if (file.name !== '.vscode/settings.json') return file
              const settings = JSON.parse(file.content)
              return {
                ...file,
                content: JSON.stringify({
                  ...settings,
                  'python.useEnvironmentsExtension': false,
                  'python.experiments.enabled': false,
                  'python.testing.unittestEnabled': false,
                  'python.testing.pytestEnabled': false,
                  'python.testing.unittestArgs': ['-v', '-s', '.', '-p', 'test_invoice.py'],
                  'python.testing.autoTestDiscoverOnSaveEnabled': false,
                }),
              }
            }),
          )
        },
      },
    },
    {},
  )
  // Add a configured folder after activation so its test adapter starts with the intended framework.
  const root = Workspace.getWorkspacePath()
  unittestFolder = `${root}-python-unittest`
  await rm(unittestFolder, { recursive: true, force: true })
  await mkdir(join(unittestFolder, '.vscode'), { recursive: true })
  await cp(join(root, 'project'), join(unittestFolder, 'project'), { recursive: true })
  const testModule = await readFile(join(import.meta.dirname, '../fixtures/python-development/test_invoice.py'), 'utf8')
  await writeFile(join(unittestFolder, 'test_invoice.py'), testModule)
  const settings = await Workspace.readWorkspaceSettings()
  await writeFile(
    join(unittestFolder, '.vscode/settings.json'),
    JSON.stringify({
      ...settings,
      'python.testing.unittestEnabled': true,
    }),
  )
  await Electron.mockOpenDialog({ canceled: false, filePaths: [unittestFolder] })
  try {
    await QuickPick.executeCommand('Workspaces: Add Folder to Workspace...', { pressKeyOnce: true })
    folderAdded = true
    await QuickPick.executeCommand('View: Show Explorer', { pressKeyOnce: true })
    await Explorer.shouldHaveItem(basename(unittestFolder))
  } finally {
    await Electron.unmockElectron('dialog', 'showOpenDialog')
  }
  // Entering a multi-folder workspace restarts the extension host.
  await Editor.open('test_invoice.py')
  await RunningExtensions.showAndWaitFor('Python')
  await RunningExtensions.showAndWaitFor('Pylance')
  await Editor.closeAll()
  await SideBar.hide()
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Output, Panel, QuickPick, SideBar, Testing, Workspace } = context
  await Workspace.remove('.python-discovered.json')
  await Workspace.remove('.python-run.json')
  try {
    await Editor.open('test_invoice.py')
    await Editor.press('Control+End')
    await Editor.type(`# Development edit ${++iteration}\n`)
    await Editor.save({ viaKeyBoard: true })
    await QuickPick.executeCommand('Output: Focus on Output View', { pressKeyOnce: true })
    await Output.select('Python')
    await QuickPick.executeCommand('View: Clear Output', { pressKeyOnce: true })
    await QuickPick.executeCommand('Test: Refresh Tests', { pressKeyOnce: true })
    assert(await Workspace.waitForFile('.python-discovered.json'))
    await Output.shouldHaveText(/Unittest\s+discovery\s+completed/)
    await Panel.hide()
    await Testing.focusOnTestExplorerView()
    await QuickPick.executeCommand('Test: Run All Tests', { pressKeyOnce: true })
    await PythonDevelopment.shouldHaveRunResult(context)
    await Testing.shouldHaveSummary('1/1')
    await Testing.clearAllResults()
  } finally {
    await Editor.closeAll()
    await SideBar.hide()
    await Panel.hide()
  }
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    if (folderAdded) {
      await context.QuickPick.executeCommand('Workspaces: Remove Folder from Workspace...', { pressKeyOnce: true, stayVisible: true })
      await context.QuickPick.select(basename(unittestFolder))
    }
  } finally {
    await PythonDevelopment.teardown(context)
    if (unittestFolder) await rm(unittestFolder, { recursive: true, force: true })
  }
}
