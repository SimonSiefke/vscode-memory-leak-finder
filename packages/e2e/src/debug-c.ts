import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `#include<stdio.h>

int main() {
	printf("Hello World\\n");
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
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('main.c')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    debugConfiguration: 'C File',
    debugLabel: 'C/C++ gcc build and debug active file',
    file: 'main.c',
    hasCallStack: false,
    line: 2,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
