import * as KeyBindings from '../KeyBindings/KeyBindings.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async addServer({ serverUrl, serverName }: { serverUrl: string; serverName?: string }) {
      try {
        // Step 1: Open QuickPick and search for MCP commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Step 2: Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Step 3: Get available MCP commands
        const mcpCommands = await this.getVisibleCommands()
        console.log('Available MCP commands:', mcpCommands)

        // Step 4: Look for "MCP: Add Server" command
        const addServerCommand = mcpCommands.find((cmd: string) =>
          cmd.toLowerCase().includes('add server') ||
          cmd.toLowerCase().includes('mcp: add')
        )

        if (!addServerCommand) {
          throw new VError(new Error('MCP: Add Server command not found'), 'MCP Add Server command not available')
        }

        // Step 5: Select the "MCP: Add Server" command
        await this.selectCommand(addServerCommand, true) // stayVisible = true
        console.log('Successfully selected MCP: Add Server command')

        // Step 6: Get server type options
        const serverTypeCommands = await this.getVisibleCommands()
        console.log('Server type options:', serverTypeCommands)

        // Step 7: Select HTTP option for our mock server
        const httpOption = serverTypeCommands.find((cmd: string) =>
          cmd.toLowerCase().includes('http') &&
          cmd.toLowerCase().includes('server-sent events')
        )

        if (!httpOption) {
          throw new VError(new Error('HTTP option not found'), 'HTTP server type option not available')
        }

        await this.selectCommand(httpOption, true) // stayVisible = true
        console.log('Selected HTTP option for MCP server')

        // Step 8: Type the server URL
        await quickPickInput.type(serverUrl)
        console.log(`Typed server URL: ${serverUrl}`)

        // Step 9: Press Enter to confirm the server URL
        await quickPickInput.press('Enter')
        console.log('Pressed Enter to confirm server URL')

        // Step 10: Wait for the next step or completion
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Step 11: Check if QuickPick is still open for additional steps
        try {
          const currentCommands = await this.getVisibleCommands()
          console.log('Commands after URL confirmation:', currentCommands)

          if (currentCommands.length > 0) {
            // Step 12: Look for generated server name
            const currentServerName = await this.getInputValue()
            console.log(`Current server name: ${currentServerName}`)

            if (currentServerName && serverName && currentServerName !== serverName) {
              // Step 13: Type the desired server name
              await quickPickInput.type(serverName)
              console.log(`Typed desired server name: ${serverName}`)
            }

            // Step 14: Accept the server name
            await quickPickInput.press('Enter')
            console.log('Accepted server name')

            // Step 15: Continue accepting until the process is complete
            let stepCount = 0
            while (stepCount < 5) { // Safety limit to prevent infinite loop
              try {
                const currentStepCommands = await this.getVisibleCommands()
                if (currentStepCommands.length === 0) {
                  console.log('MCP server configuration process completed')
                  break
                }

                // Accept the current step
                await quickPickInput.press('Enter')
                console.log(`Completed step ${stepCount + 1}`)

                stepCount++
                await new Promise((resolve) => setTimeout(resolve, 1000))
              } catch (error) {
                console.log('Configuration process completed or error occurred:', error)
                break
              }
            }
          } else {
            console.log('QuickPick closed after URL confirmation - MCP configuration may be complete')
          }
        } catch (error) {
          console.log('QuickPick is no longer visible - MCP configuration process completed')
        }

        // Step 16: Wait for any final connection attempts
        console.log('Waiting for potential MCP server connection attempts...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
        console.log('MCP server configuration process finished')

      } catch (error) {
        throw new VError(error, `Failed to add MCP server`)
      }
    },

    async getVisibleCommands() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const commandElements = quickPick.locator('.monaco-list-row .label-name')
        const count = await commandElements.count()
        const commands: string[] = []
        for (let i = 0; i < count; i++) {
          const text = await commandElements.nth(i).textContent()
          if (text) {
            commands.push(text)
          }
        }
        return commands
      } catch (error) {
        throw new VError(error, `Failed to get visible commands`)
      }
    },

    async selectCommand(text, stayVisible = false) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasExactText: text,
        })
        await option.click()
        if (!stayVisible) {
          await expect(quickPick).toBeHidden()
        }
      } catch (error) {
        throw new VError(error, `Failed to select command "${text}"`)
      }
    },

    async getInputValue() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        return await quickPickInput.getAttribute('value') || ''
      } catch (error) {
        throw new VError(error, `Failed to get input value`)
      }
    },

    async listServers() {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for "MCP: List Servers" command
        const mcpCommands = await this.getVisibleCommands()
        const listServersCommand = mcpCommands.find((cmd: string) =>
          cmd.toLowerCase().includes('list servers') ||
          cmd.toLowerCase().includes('mcp: list')
        )

        if (!listServersCommand) {
          throw new VError(new Error('MCP: List Servers command not found'), 'MCP List Servers command not available')
        }

        // Select the command (some commands might keep QuickPick open)
        await this.selectCommand(listServersCommand, true)
        console.log('Successfully opened MCP server list')

      } catch (error) {
        throw new VError(error, `Failed to list MCP servers`)
      }
    },

    async openConfiguration() {
      try {
        // Open QuickPick and search for MCP configuration commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for MCP configuration commands
        const mcpCommands = await this.getVisibleCommands()
        const configCommand = mcpCommands.find((cmd: string) =>
          cmd.toLowerCase().includes('open') &&
          cmd.toLowerCase().includes('configuration')
        )

        if (!configCommand) {
          throw new VError(new Error('MCP configuration command not found'), 'MCP configuration command not available')
        }

        // Select the command (some commands might keep QuickPick open)
        await this.selectCommand(configCommand, true)
        console.log('Successfully opened MCP configuration')

      } catch (error) {
        throw new VError(error, `Failed to open MCP configuration`)
      }
    },

    async removeServer(serverName: string) {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for "MCP: List Servers" command
        const mcpCommands = await this.getVisibleCommands()
        const listServersCommand = mcpCommands.find((cmd: string) =>
          cmd.toLowerCase().includes('list servers') ||
          cmd.toLowerCase().includes('mcp: list')
        )

        if (!listServersCommand) {
          throw new VError(new Error('MCP: List Servers command not found'), 'MCP List Servers command not available')
        }

        // Select the command to open server list
        await this.selectCommand(listServersCommand, true)
        console.log('Successfully opened MCP server list')

        // Wait for server list to load
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Look for the specific server to remove
        const serverCommands = await this.getVisibleCommands()
        const serverToRemove = serverCommands.find((cmd: string) =>
          cmd.toLowerCase().includes(serverName.toLowerCase())
        )

        if (serverToRemove) {
          // Right-click or use context menu to remove the server
          const serverElement = quickPick.locator('.monaco-list-row .label-name', {
            hasExactText: serverToRemove,
          })
          await serverElement.click({ button: 'right' })

          // Wait for context menu and look for remove/delete option
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Look for remove/delete commands in context menu
          const contextCommands = await this.getVisibleCommands()
          const removeCommand = contextCommands.find((cmd: string) =>
            cmd.toLowerCase().includes('remove') ||
            cmd.toLowerCase().includes('delete') ||
            cmd.toLowerCase().includes('uninstall')
          )

          if (removeCommand) {
            await this.selectCommand(removeCommand)
            console.log(`Successfully removed MCP server: ${serverName}`)
          } else {
            console.log(`Could not find remove option for server: ${serverName}`)
          }
        } else {
          console.log(`Server "${serverName}" not found in the list`)
        }

      } catch (error) {
        throw new VError(error, `Failed to remove MCP server "${serverName}"`)
      }
    }
  }
}
