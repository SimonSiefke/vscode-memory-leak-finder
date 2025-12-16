import type { TestContext } from '../types.ts'

export const setup = async ({
  GitHubPullRequests,
  Workspace,
  Extensions,
  Editor,
  ExtensionDetailView,
  Git,
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
  await GitHubPullRequests.checkoutIndex(0)
  await new Promise((r) => {})
}

export const run = async ({ GitHubPullRequests, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await GitHubPullRequests.checkoutIndex(1)
  await Editor.closeAll()
  await GitHubPullRequests.checkoutIndex(0)
  await Editor.closeAll()
}
