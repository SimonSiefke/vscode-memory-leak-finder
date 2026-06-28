import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Electron, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: JSON.stringify(
        {
          name: 'debug-profile-test',
          private: true,
          scripts: {
            start: 'node index.js',
          },
          version: '1.0.0',
        },
        null,
        2,
      ),
      name: 'package.json',
    },
    {
      content: JSON.stringify(
        {
          configurations: [
            {
              name: 'Launch Program',
              program: '${workspaceFolder}/index.js',
              request: 'launch',
              type: 'node',
            },
          ],
          version: '0.2.0',
        },
        null,
        2,
      ),
      name: '.vscode/launch.json',
    },
    {
      content: `let counter = 0

setInterval(() => {
  counter++
}, 1000)
`,
      name: 'index.js',
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
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 6,
    file: 'index.js',
    line: 4,
    viaIcon: true,
  })
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  // @ts-ignore
  await RunAndDebug.takeCpuProfile({ seconds: 3 })
  // @ts-ignore
  await Editor.closeOthers()
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  // TODO need to call continue
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
