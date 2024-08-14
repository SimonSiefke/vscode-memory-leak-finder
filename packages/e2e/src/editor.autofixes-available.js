export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Workspace, Editor }) => {
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
  await Editor.autoFix({ hasFixes: true })
  await Editor.shouldHaveText(`let abc = 1

const def = abc + 1`)
  await Editor.save()
  await Editor.closeAll()
}
