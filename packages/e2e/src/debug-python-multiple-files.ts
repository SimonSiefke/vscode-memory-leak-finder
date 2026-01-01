import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace, ActivityBar }: TestContext): Promise<void> => {
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
  // @ts-ignore
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('main.py')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Python Debugger',
    debugConfiguration: 'Python File',
    file: 'main.py',
    line: 4,
    hasCallStack: false,
  })
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  // @ts-ignore
  await RunAndDebug.stepInto({
    expectedFile: 'test.py',
    expectedPauseLine: 3,
    expectedCallStackSize: 2,
    hasCallStack: false,
  })
  // @ts-ignore
  await RunAndDebug.stepOutOf({
    expectedFile: 'main.py',
    expectedPauseLine: 4,
    expectedCallStackSize: 2,
    hasCallStack: false,
  })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
