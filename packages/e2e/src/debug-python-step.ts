import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ActivityBar, Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `def add(a, b):
    result = a + b
    result-=1
    result+=1
    return result

if __name__ == '__main__':
    x = add(1, 2)
    print(x)
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
  await ActivityBar.showRunAndDebug()
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('main.py')
  await Editor.setBreakpoint(2)
  await RunAndDebug.runAndWaitForPaused({
    debugConfiguration: 'Python File',
    debugLabel: 'Python Debugger',
    file: 'main.py',
    hasCallStack: false,
    line: 2,
  })
  // @ts-ignore
  await RunAndDebug.step({
    file: 'main.py',
    line: 3,
    hasCallStack: false,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
