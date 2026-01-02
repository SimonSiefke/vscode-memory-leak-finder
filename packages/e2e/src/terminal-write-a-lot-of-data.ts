import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      content: `for(let i=0;i<60_000;i++){
  process.stdout.write('abc\\n')
}`,
      name: 'file.js',
    },
  ])
  await SideBar.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.execute('node file.js && touch test.txt', {
    waitForFile: 'test.txt',
  })
  await Terminal.clear()
  await Workspace.remove('test.txt')
}
