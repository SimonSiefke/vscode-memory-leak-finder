import type { TestContext } from '../types.ts'

const alphaCss = `.alpha {
  abc
}

.beta {
  def
}
`

const betaCss = `.gamma {
  ghi
}
`

export const skip = 1

export const setup = async ({ Editor, Problems, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: alphaCss,
      name: 'alpha.css',
    },
    {
      content: betaCss,
      name: 'beta.css',
    },
  ])
  await Editor.open('alpha.css')
  await Editor.shouldHaveSquigglyError()
  await Editor.open('beta.css')
  await Editor.shouldHaveSquigglyError()
  await Problems.show()
  await Problems.switchToTableView()
  await Problems.shouldHaveVisibleTextCount('alpha.css', 2)
  await Problems.shouldHaveVisibleTextCount('beta.css', 2)
  await Problems.shouldHaveCount(4)
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  await Problems.filter('alpha.css')
  await Problems.shouldHaveVisibleCount(2)
  await Problems.shouldHaveVisibleTextCount('alpha.css', 2)
  await Problems.shouldHaveVisibleTextCount('beta.css', 0)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
