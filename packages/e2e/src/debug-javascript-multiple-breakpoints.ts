import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `export function add(a,b){
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
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('main.js')
  await Editor.setBreakpoint(3)
  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 11,
    file: 'main.js',
    line: 4,
    hasCallStack: false,
  })
  await new Promise((r) => {})
  // @ts-ignore
  // await RunAndDebug.step('index.js', 5)
  // await RunAndDebug.stop()
  // await RunAndDebug.removeAllBreakpoints()
  // await Editor.closeAll()
}
