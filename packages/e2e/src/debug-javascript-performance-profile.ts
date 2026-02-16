import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Electron, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'package.json',
      content: JSON.stringify(
        {
          name: 'debug-profile-test',
          private: true,
          version: '1.0.0',
          scripts: {
            start: 'node index.js',
          },
        },
        null,
        2,
      ),
    },
    {
      name: '.vscode/launch.json',
      content: JSON.stringify(
        {
          version: '0.2.0',
          configurations: [
            {
              type: 'node',
              request: 'launch',
              name: 'Launch Program',
              program: '${workspaceFolder}/index.js',
            },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: 'index.js',
      content: `let counter = 0

setInterval(() => {
  counter++
}, 1000)
`,
    },
  ])

  // @ts-ignore
  const filePath = Workspace.getWorkspaceFilePath('debug-performance-profile.cpuprofile')
  await Electron.mockSaveDialog({
    canceled: false,
    filePath,
  })
  await Electron.mockDialog({
    response: 0,
  })

  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ Editor, Explorer, QuickPick, RunAndDebug, WellKnownCommands }: TestContext): Promise<void> => {
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)

  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 6,
    file: 'index.js',
    line: 4,
  })

  await QuickPick.executeCommand('Debug: Take Performance Profile')
  await QuickPick.executeCommand(WellKnownCommands.FileSave)
  await Explorer.shouldHaveItem('debug-performance-profile.cpuprofile')

  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
