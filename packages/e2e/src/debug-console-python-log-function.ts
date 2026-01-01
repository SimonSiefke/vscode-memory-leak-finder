import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({
  SideBar,
  Editor,
  Extensions,
  RunAndDebug,
  Workspace,
  ActivityBar,
  DebugConsole,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `def add(a, b):
    result = a + b
    return result

if __name__ == '__main__':
    x = add(1, 2)
    print(x)
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
  await Editor.setBreakpoint(2)
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Python Debugger',
    debugConfiguration: 'Python File',
    file: 'main.py',
    line: 2,
    hasCallStack: false,
  })
  await DebugConsole.show()
  await SideBar.hide()
}

export const run = async ({ DebugConsole }: TestContext): Promise<void> => {
  await DebugConsole.evaluate({
    expression: 'add',
    expectedResult: {
      message: /^<function add/,
      type: '',
    },
  })
  // @ts-ignore
  await DebugConsole.expand({
    label: '<function add',
  })
  // @ts-ignore
  await DebugConsole.expand({
    label: 'Variable special variables',
  })
  await DebugConsole.clear()
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
