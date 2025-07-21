export const skip = true

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
  await Editor.goToSourceDefinition({ hasDefinition: false })
  await Notification.closeAll()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
