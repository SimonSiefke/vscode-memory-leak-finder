import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ActivityBar, Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
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
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  // @ts-ignore
  await RunAndDebug.setValue({
    newVariableValue: '11',
    scopeName: 'Scope Locals',
    variableName: `a`,
    variableValue: '1',
  })
  // @ts-ignore
  await RunAndDebug.setValue({
    newVariableValue: '1',
    scopeName: 'Scope Locals',
    variableName: `a`,
    variableValue: '11',
  })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
