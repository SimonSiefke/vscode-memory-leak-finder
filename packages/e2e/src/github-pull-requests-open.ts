import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, Git, GitHubPullRequests, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Git.cloneRepository('https://github.com/octocat/Hello-World.git')
  // @ts-ignore
  await Extensions.install({
    id: 'github pull requests',
    name: 'GitHub Pull Requests',
  })
  await Editor.closeAll()
  await GitHubPullRequests.focusView()
}

export const run = async ({ ActivityBar, GitHubPullRequests, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await ActivityBar.showExplorer()
  await GitHubPullRequests.focusView()
}

export const teardown = async ({ SideBar }: TestContext) => {
  await SideBar.hide()
}
