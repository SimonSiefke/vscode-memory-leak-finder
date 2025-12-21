import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({
  Editor,
  ExtensionDetailView,
  Extensions,
  Git,
  GitHubPullRequests,
  Workspace,
}: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Git.cloneRepository('https://github.com/octocat/Hello-World.git')
  await Extensions.show()
  await Extensions.search('github pull requests')
  await Extensions.first.shouldBe('GitHub Pull Requests')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
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
