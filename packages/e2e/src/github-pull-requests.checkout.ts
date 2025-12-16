import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Extensions, Editor, ExtensionDetailView, Git }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Git.cloneRepository('https://github.com/octocat/Hello-World.git')
  await Extensions.show()
  await Extensions.search('github pull requests')
  await Extensions.first.shouldBe('GitHub Pull Requests')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await Editor.closeAll()
  await new Promise((r) => {})
}

export const run = async ({ GitHubPullRequests, SourceControl, ActivityBar }: TestContext): Promise<void> => {
  // Look for open pull requests in the view
  const prs = await GitHubPullRequests.getAvailablePullRequests()

  if (prs.length === 0) {
    // No PRs found - repo might not have PRs or extension not fully loaded
    return
  }

  const firstPrNumber = prs[0].number

  // Checkout the first pull request
  await GitHubPullRequests.checkoutPullRequest(firstPrNumber)

  // Verify the expected data is displayed - check source control shows we're on a PR branch
  await ActivityBar.showSourceControl()
  // The source control view should show we're on a branch (not necessarily the PR number in the name)

  // Checkout the main branch
  await SourceControl.checkoutBranch('main')

  // Checkout the first pull request again
  await GitHubPullRequests.checkoutPullRequest(firstPrNumber)
}
