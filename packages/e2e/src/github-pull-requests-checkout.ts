import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, Git, GitHubPullRequests, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Git.cloneRepository('https://github.com/octocat/Hello-World.git')
  await Extensions.install({
    id: 'github pull requests',
    name: 'GitHub Pull Requests',
  })
  await GitHubPullRequests.focusView()
  await GitHubPullRequests.checkoutIndex(0)
}

export const run = async ({ Editor, GitHubPullRequests }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await GitHubPullRequests.checkoutIndex(1)
  await Editor.closeAll()
  await GitHubPullRequests.checkoutIndex(0)
  await Editor.closeAll()
}
