import type { TestContext } from '../types.ts'

export const setup = async ({ Extensions, Editor, ExtensionDetailView, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Open extensions view
  await Extensions.show()

  // Search for GitHub Pull Requests extension
  await Extensions.search('github pull requests')

  // Wait for results and verify the extension appears
  await Extensions.first.shouldBe('GitHub Pull Requests and Issues')

  // Click on the extension to open detail view
  await Extensions.first.click()

  // Verify we're in the detail view
  await ExtensionDetailView.shouldHaveHeading('GitHub Pull Requests and Issues')

  // Install the extension
  await ExtensionDetailView.installExtension()

  // Close the extension detail view
  await Editor.closeAll()

  // Clone a repository (choose a smaller repository with pull requests)
  // Using a smaller popular repository that likely has open PRs
  await QuickPick.showCommands()
  await QuickPick.type('Git: Clone')
  await QuickPick.select('Git: Clone')
  // Enter the repository URL - using a smaller repo
  await QuickPick.type('https://github.com/octocat/Hello-World.git')
  await QuickPick.pressEnter()
  // Select the folder to clone into (or press Enter to use default)
  await QuickPick.pressEnter()
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Use QuickPick to checkout a pull request
  // The GitHub Pull Requests extension typically provides commands like "GitHub Pull Requests: Checkout Pull Request"
  await QuickPick.showCommands()
  await QuickPick.type('GitHub Pull Requests: Checkout')

  // Get visible commands to find the checkout command
  const checkoutCommands = await QuickPick.getVisibleCommands()
  const checkoutCommand = checkoutCommands.find((cmd: string) =>
    cmd.toLowerCase().includes('checkout') && (cmd.toLowerCase().includes('pull request') || cmd.toLowerCase().includes('pr'))
  )

  if (checkoutCommand) {
    // Select the checkout command - this will open a list of PRs
    // @ts-ignore - select accepts stayVisible as second parameter
    await QuickPick.select(checkoutCommand, true)
    // Wait for PR list to appear, then select the first PR
    await QuickPick.pressEnter()
  } else {
    // Fallback: try to execute the command directly
    await QuickPick.executeCommand('GitHub Pull Requests: Checkout Pull Request')
    // If the command opens a PR picker, select the first one
    await QuickPick.pressEnter()
  }
}
