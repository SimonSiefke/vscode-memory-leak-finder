import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `process.on('uncaughtException', () => {
  // Ignore exception to keep process running
})

setInterval(() => {
  throw new Error('Test exception')
}, 1000)
`,
      name: 'index.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('index.js')
  await ActivityBar.showRunAndDebug()
  // @ts-ignore
  await RunAndDebug.startRunAndDebug({
    debugLabel: 'Node.js',
  })
  await RunAndDebug.setPauseOnExceptions({
    pauseOnCaughtExceptions: true,
    pauseOnExceptions: true,
  })
  await RunAndDebug.waitForPausedOnException({
    exception: true,
    file: 'index.js',
    line: 6,
  })
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.shouldHaveExceptionWidget()
  await RunAndDebug.continue()
  await RunAndDebug.waitForPausedOnException({
    exception: true,
    file: 'index.js',
    line: 6,
  })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext) => {
  await RunAndDebug.stop()
  await Editor.closeAll()
}
