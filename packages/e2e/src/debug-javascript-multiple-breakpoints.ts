import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `export function add(a,b){
a++
a--
if(a === 0){
  return b
}
if(a > 0){
  return add(a-1, b) + 1
}
return add(a+1, b) - 1
}`,
      name: 'add.js',
    },
    {
      content: `import { add } from './add.js'

add(1000, 1)
`,
      name: 'main.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('main.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('main.js')
  await Editor.setBreakpoint(3)
  await Editor.closeAll()
  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 11,
    file: 'main.js',
    line: 4,
    hasCallStack: false,
  })
  await Editor.open('add.js')
  await Editor.setBreakpoint(3)
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.continue()
  await RunAndDebug.waitForPaused({
    callStackSize: 11,
    file: 'add.js',
    line: 3,
    hasCallStack: false,
  })
  // @ts-ignore
  await Editor.removeBreakPoint(3)
  await Editor.setBreakpoint(4)
  // @ts-ignore
  await RunAndDebug.step('add.js', 4, 0, false)
  // @ts-ignore
  await Editor.removeBreakPoint(4)
  // @ts-ignore
  await Editor.setBreakpoint(3)

  await new Promise((r) => {})
  // @ts-ignore
  // await RunAndDebug.step('index.js', 5)
  // await RunAndDebug.stop()
  // await RunAndDebug.removeAllBreakpoints()
  // await Editor.closeAll()
}
