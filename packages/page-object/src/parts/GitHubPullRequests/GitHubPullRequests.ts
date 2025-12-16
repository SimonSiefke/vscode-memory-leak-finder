import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async focusView() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusOnPullRequestsView)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus on Pull Requests view`)
      }
    },
    async findCheckoutCommands(): Promise<string[]> {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.showCommands()
        await quickPick.type('GitHub Pull Requests: Checkout')
        const allCommands = await quickPick.getVisibleCommands()
        const checkoutCommands = allCommands.filter((cmd: string) =>
          cmd.toLowerCase().includes('checkout') && (cmd.toLowerCase().includes('pull request') || cmd.toLowerCase().includes('pr'))
        )
        return checkoutCommands
      } catch (error) {
        throw new VError(error, `Failed to find checkout commands`)
      }
    },
    async getAvailablePullRequests(): Promise<Array<{ number: string; command: string }>> {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        const checkoutCommands = await this.findCheckoutCommands()
        
        if (checkoutCommands.length === 0) {
          return []
        }

        // Execute the first checkout command to show PR list
        const firstCheckoutCommand = checkoutCommands[0]
        await quickPick.select(firstCheckoutCommand, true)
        
        // Wait for PR list to appear
        const { resolve, promise } = Promise.withResolvers<void>()
        setTimeout(resolve, 2000)
        await promise

        // Get the list of PRs from the QuickPick
        const prCommands = await quickPick.getVisibleCommands()
        const prNumbers = prCommands
          .map((cmd: string) => {
            const match = cmd.match(/#(\d+)/)
            return match ? { number: match[1], command: cmd } : null
          })
          .filter((pr: { number: string; command: string } | null) => pr !== null)

        return prNumbers as Array<{ number: string; command: string }>
      } catch (error) {
        throw new VError(error, `Failed to get available pull requests`)
      }
    },
    async checkoutPullRequest(prNumber: string): Promise<void> {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.showCommands()
        await quickPick.type('GitHub Pull Requests: Checkout')
        
        const checkoutCommands = await this.findCheckoutCommands()
        
        if (checkoutCommands.length === 0) {
          throw new Error('No checkout commands found')
        }

        // Execute checkout command to show PR list
        const firstCheckoutCommand = checkoutCommands[0]
        await quickPick.select(firstCheckoutCommand, true)
        
        // Wait for PR list
        const { resolve, promise } = Promise.withResolvers<void>()
        setTimeout(resolve, 2000)
        await promise
        
        // Find and select the PR
        const prCommands = await quickPick.getVisibleCommands()
        const prCommand = prCommands.find((cmd: string) => cmd.includes(`#${prNumber}`))
        
        if (prCommand) {
          await quickPick.select(prCommand)
        } else {
          // Fallback: select the first item
          await quickPick.pressEnter()
        }

        // Wait for checkout to complete
        const { resolve: resolve2, promise: promise2 } = Promise.withResolvers<void>()
        setTimeout(resolve2, 3000)
        await promise2
      } catch (error) {
        throw new VError(error, `Failed to checkout pull request #${prNumber}`)
      }
    },
    async checkoutFirstPullRequest(): Promise<string> {
      try {
        const prs = await this.getAvailablePullRequests()
        
        if (prs.length === 0) {
          throw new Error('No pull requests available')
        }

        const firstPr = prs[0]
        await this.checkoutPullRequest(firstPr.number)
        return firstPr.number
      } catch (error) {
        throw new VError(error, `Failed to checkout first pull request`)
      }
    },
  }
}

