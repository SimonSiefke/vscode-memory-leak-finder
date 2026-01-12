import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug",
            "program": "\${workspaceFolder}/main",
            "args": [],
            "cwd": "\${workspaceFolder}"
        }
    ]
}
`,
      name: '.vscode/launch.json',
    },
    {
      content: `fn add(a: i32, b: i32) -> i32 {
    let result = a + b;
    result
}

fn main() {
    let x = add(1, 2);
    println!("{}", x);
}
`,
      name: 'main.rs',
    },
  ])
  await Extensions.install({
    id: 'rust-lang.rust-analyzer',
    name: 'rust-analyzer',
  })
  await Extensions.install({
    id: 'vadimcn.vscode-lldb',
    name: 'CodeLLDB',
  })
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('main.rs')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(2)
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Debug',
    file: 'main.rs',
    hasCallStack: false,
    line: 2,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
