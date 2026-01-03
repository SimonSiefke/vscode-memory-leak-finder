import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({
  ActivityBar,
  DebugConsole,
  Editor,
  Extensions,
  RunAndDebug,
  SideBar,
  Workspace,
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
    debugConfiguration: 'Python File',
    debugLabel: 'Python Debugger',
    file: 'main.py',
    hasCallStack: false,
    line: 2,
  })
  await DebugConsole.show()
  await SideBar.hide()
}

export const run = async ({ DebugConsole }: TestContext): Promise<void> => {
  await DebugConsole.evaluate({
    expectedResult: {
      message: /^<function add/,
      type: '',
    },
    expression: 'add',
    hasSuggest: true,
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
