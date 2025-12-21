import type { TestContext } from '../types.ts'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ ActivityBar, Editor, Workspace, Explorer, RunAndDebug }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
=======
export const setup = async ({ ActivityBar, Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
>>>>>>> origin/main
      content: `process.on('uncaughtException', () => {
  // Ignore exception to keep process running
})

setInterval(() => {
  throw new Error('Test exception')
}, 1000)
`,
<<<<<<< HEAD
=======
      name: 'index.js',
>>>>>>> origin/main
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('index.js')
  await ActivityBar.showRunAndDebug()
  await RunAndDebug.startRunAndDebug()
  await RunAndDebug.setPauseOnExceptions({
<<<<<<< HEAD
    pauseOnExceptions: true,
    pauseOnCaughtExceptions: true,
  })
  await RunAndDebug.waitForPausedOnException({
    file: 'index.js',
    line: 6,
    exception: true,
=======
    pauseOnCaughtExceptions: true,
    pauseOnExceptions: true,
  })
  await RunAndDebug.waitForPausedOnException({
    exception: true,
    file: 'index.js',
    line: 6,
>>>>>>> origin/main
  })
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.shouldHaveExceptionWidget()
  await RunAndDebug.continue()
  await RunAndDebug.waitForPausedOnException({
<<<<<<< HEAD
    file: 'index.js',
    line: 6,
    exception: true,
=======
    exception: true,
    file: 'index.js',
    line: 6,
>>>>>>> origin/main
  })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext) => {
  await RunAndDebug.stop()
  await Editor.closeAll()
}
