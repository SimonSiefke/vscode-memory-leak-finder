import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `#include<stdio.h>

int main() {
	printf("Hello World\n");
	return 0;
}
`,
      name: 'main.c',
    },
  ])
  await Extensions.install({
    id: 'ms-vscode.cpptools',
    name: 'C/C++',
  })
  await new Promise((r) => {})
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
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
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
