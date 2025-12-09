import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Electron, Workspace, Search }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'test-file-1.ts',
      content: 'const value1 = "test123"\nconst value2 = "test456"',
    },
    {
      name: 'test-file-2.ts',
      content: 'const value3 = "test789"\nconst value4 = "test012"',
    },
    {
      name: 'other-file.txt',
      content: 'some other content',
    },
  ])
  await ActivityBar.showSearch()
  await Electron.mockDialog({ response: 1 })
  await Search.expandFiles()
  // @ts-ignore
  await Search.setFilesToInclude('test*.ts')
  // @ts-ignore
  await Search.enableRegex()
}

export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.type('test(\\d+)')
  await Search.toHaveResults([
    'test-file-1.ts2',
    'const value1 = "test123"',
    'const value2 = "test456"',
    'test-file-2.ts2',
    'const value3 = "test789"',
    'const value4 = "test012"',
  ])
  await Search.typeReplace('replaced$1')
  await Search.replace()
  await Search.typeReplace('')
  await Search.type('replaced(\\d+)')
  await Search.toHaveResults([
    'test-file-1.ts2',
    'const value1 = "replaced123"',
    'const value2 = "replaced456"',
    'test-file-2.ts2',
    'const value3 = "replaced789"',
    'const value4 = "replaced012"',
  ])
  await Search.typeReplace('test$1')
  await Search.replace()
  await Search.typeReplace('')
}
