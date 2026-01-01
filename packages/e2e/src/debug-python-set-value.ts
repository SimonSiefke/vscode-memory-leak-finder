import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace, ActivityBar }: TestContext): Promise<void> => {
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
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  // @ts-ignore
  await RunAndDebug.setValue({
    variableName: `a`,
    variableValue: '1',
    newVariableValue: '11',
    scopeName: 'Scope Locals',
  })
  // @ts-ignore
  await RunAndDebug.setValue({
    variableName: `a`,
    variableValue: '11',
    newVariableValue: '1',
    scopeName: 'Scope Locals',
  })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
