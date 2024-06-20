export const skip = true

export const setup = async ({ Editor, Workspace, QuickPick }) => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `:root {
  --font-size: 10px;
  --font-size: 10px;
}`,
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
  --font-size: 10px;
}`)
  await Editor.shouldHaveBreadCrumb(':root')
}

export const run = async ({}) => {}
