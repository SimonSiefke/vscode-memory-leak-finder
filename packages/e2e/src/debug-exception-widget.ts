import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({
  Editor,
  Workspace,
  Explorer,
  RunAndDebug,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
      content: `throw new Error('Test exception')
`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('index.js')
  await RunAndDebug.startRunAndDebug()
  await RunAndDebug.setPauseOnExceptions({
    pauseOnExceptions: true,
    pauseOnCaughtExceptions: true,
  })
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.waitForPausedOnException({
    file: 'index.js',
    line: 1,
  })
  await Editor.shouldHaveExceptionWidget()
  await RunAndDebug.continue()
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}

