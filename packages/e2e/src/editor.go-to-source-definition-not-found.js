export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'tsconfig.json',
      content: `{}
`,
    },
    {
      name: 'file.ts',
      content: `abc
def`,
    },
  ])
  await Editor.open('file.ts')
  // await Editor.goToFile({ file: 'file.ts', line: 2, column: 1 })
}

export const run = async ({ Editor }) => {
  await Editor.autoFix({ hasFixes: false })
  await Editor.closeAutoFix()
}
