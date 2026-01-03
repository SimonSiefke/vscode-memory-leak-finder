import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `export function add(a,b){
  a++
  a--
  return a + b
}`,
      name: 'add.js',
    },
    {
      content: `import { add } from './add.js'

for(let i=0;i<1000;i++){
  add(1000, 1)
}
`,
      name: 'main.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('main.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('main.js')
  await Editor.setBreakpoint(3)
  await Editor.closeAll()
  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 11,
    file: 'main.js',
    hasCallStack: false,
    line: 4,
  })
  await Editor.open('add.js')
  await Editor.setBreakpoint(2)
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.continue()
  await RunAndDebug.waitForPaused({
    callStackSize: 11,
    file: 'add.js',
    hasCallStack: false,
    line: 3,
  })

  // @ts-ignore
  await Editor.removeBreakPoint(2)
  await Editor.setBreakpoint(3)
  // @ts-ignore
  await RunAndDebug.step('add.js', 3, 0, false)
  // @ts-ignore
  await Editor.removeBreakPoint(3)

  await Editor.setBreakpoint(2)
}
