export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.ts',
      content: `let abc = 1

const def = abcd + 1
`,
    },
  ])
  await Editor.open('file.ts')
  await Editor.goToFile({ file: 'file.ts', line: 3, column: 14 })
  await Editor.shouldHaveError('file.ts')
}

export const run = async ({ Editor }) => {
  await Editor.autoFix({ hasFixes: false })
  await Editor.closeAutoFix()
}
