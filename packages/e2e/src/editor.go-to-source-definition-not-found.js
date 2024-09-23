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
}

export const run = async ({ Editor, Notification }) => {
  await Editor.goToSourceDefinition()
  await Notification.closeAll()
}
