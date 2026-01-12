import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `module example

go 1.21
`,
      name: 'go.mod',
    },
    {
      content: `package main

import "fmt"

func add(a, b int) int {
	result := a + b
	return result
}

func main() {
	x := add(1, 2)
	fmt.Println(x)
}
`,
      name: 'main.go',
    },
  ])
  await Extensions.install({
    id: 'golang.go',
    name: 'Go',
  })
  await Editor.closeAll()
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('main.go')
  await ActivityBar.showRunAndDebug()
  await Editor.setBreakpoint(6)
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Go: Launch Package',
    file: 'main.go',
    hasCallStack: false,
    line: 6,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
