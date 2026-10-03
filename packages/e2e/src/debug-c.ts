import { spawnSync } from 'node:child_process'
import { chmodSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Extensions.disable({ id: 'copilot' })
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
      "miDebuggerPath": "\${workspaceFolder}/gdb-wrapper.sh",
      "stopAtEntry": true,
      "externalConsole": false
    }
  ]
}
`,
      name: '.vscode/launch.json',
    },
    {
      content: `#!/bin/sh
unset DEBUGINFOD_URLS
exec gdb "$@"
`,
      name: 'gdb-wrapper.sh',
    },
  ])
  chmodSync(join(workspacePath, 'gdb-wrapper.sh'), 0o755)
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
  let debuggerStarted = false
  try {
    await Editor.open('main.c')
    await ActivityBar.showRunAndDebug()
    await RunAndDebug.startRunAndDebug({
      debugLabel: 'Debug C',
      viaIcon: true,
    })
    debuggerStarted = true
    await RunAndDebug.waitForPaused({
      file: 'main.c',
      hasCallStack: false,
      line: 2,
    })
  } finally {
    try {
      if (debuggerStarted) {
        await RunAndDebug.stop()
      }
    } finally {
      try {
        await RunAndDebug.removeAllBreakpoints()
      } finally {
        await Editor.closeAll()
      }
    }
  }
}
