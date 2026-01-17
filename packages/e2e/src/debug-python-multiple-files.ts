import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ActivityBar, Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `myvar = 42
def test_func():
    print("Hello!")`,
      name: 'test.py',
    },
    {
      content: `import test

if __name__ == '__main__':
    test.test_func()
  `,
      name: 'main.py',
    },
  ])

  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('main.py')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(4)
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.runAndWaitForPaused({
    debugConfiguration: 'Python File',
    debugLabel: 'Python Debugger',
    file: 'main.py',
    hasCallStack: false,
    line: 4,
  })

  // @ts-ignore
  await RunAndDebug.stepInto({
    expectedCallStackSize: 2,
    expectedFile: 'test.py',
    expectedPauseLine: 3,
    hasCallStack: false,
  })
  // @ts-ignore
  await RunAndDebug.stepOutOf({
    expectedCallStackSize: 2,
    expectedFile: 'main.py',
    expectedPauseLine: 4,
    hasCallStack: false,
  })
  await RunAndDebug.stop()
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
