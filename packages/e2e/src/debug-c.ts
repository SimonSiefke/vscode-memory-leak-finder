import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')

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
      content: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug C",
      "type": "cppdbg",
      "request": "launch",
      "program": "\${workspaceFolder}/main",
      "cwd": "\${workspaceFolder}",
      "MIMode": "gdb",
      "miDebuggerPath": "/usr/bin/gdb",
      "miDebuggerArgs": "--command=\${workspaceFolder}/.gdbinit",
      "stopAtEntry": true,
      "externalConsole": false
    }
  ]
}
`,
      name: '.vscode/launch.json',
    },
    {
      content: 'set debuginfod enabled off\n',
      name: '.gdbinit',
    },
  ])
  const compileResult = spawnSync('gcc', ['-g', 'main.c', '-o', 'main'], {
    cwd: workspacePath,
    encoding: 'utf8',
  })
  if (compileResult.error) {
    throw compileResult.error
  }
  if (compileResult.status !== 0) {
    throw new Error(`Failed to compile C fixture: ${compileResult.stderr}`)
  }
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
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Debug C',
    file: 'main.c',
    hasCallStack: false,
    line: 2,
    viaIcon: true,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext) => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
