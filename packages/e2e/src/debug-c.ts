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
    {
      content: JSON.stringify(
        {
          version: '0.2.0',
          configurations: [
            {
              name: 'Debug C file',
              type: 'cppdbg',
              request: 'launch',
              program: '${workspaceFolder}/main',
              args: [],
              stopAtEntry: false,
              cwd: '${workspaceFolder}',
              environment: [],
              externalConsole: false,
              MIMode: 'gdb',
              miDebuggerPath: '/usr/bin/gdb',
              preLaunchTask: 'Build C file',
            },
          ],
        },
        null,
        2,
      ),
      name: '.vscode/launch.json',
    },
    {
      content: JSON.stringify(
        {
          version: '2.0.0',
          tasks: [
            {
              label: 'Build C file',
              type: 'shell',
              command: 'gcc',
              args: ['-g', '${workspaceFolder}/main.c', '-o', '${workspaceFolder}/main'],
              group: 'build',
              problemMatcher: ['$gcc'],
            },
          ],
        },
        null,
        2,
      ),
      name: '.vscode/tasks.json',
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
    debugLabel: 'Debug C file',
    file: 'main.c',
    hasCallStack: false,
    line: 2,
    viaCommand: true,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
