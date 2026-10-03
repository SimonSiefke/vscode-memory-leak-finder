import { setTimeout as delay } from 'node:timers/promises'
import type { TestContext } from '../types.ts'
import { ensureGoToolchain } from '../helpers/ensureGoToolchain.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions, Notification, QuickPick, Terminal, Workspace }: TestContext): Promise<void> => {
  const { goBinary, goRoot, goplsBinary } = await ensureGoToolchain()
  await Workspace.setFiles([
    {
      content: `module example.com/progress-terminal

go 1.26.0
`,
      name: 'go.mod',
    },
    {
      content: `package main

import "fmt"

func main() {
	fmt.Println("hello from Go")
}
`,
      name: 'main.go',
    },
  ])
  await Workspace.updateWorkspaceSettings({
    'go.alternateTools': {
      go: goBinary,
      gopls: goplsBinary,
    },
    'go.goroot': goRoot,
    'go.toolsManagement.checkForUpdates': 'off',
  })
  await delay(2000)
  await Extensions.install({
    id: 'golang.go',
    name: 'Go',
  })
  await QuickPick.openFile('go.mod')
  await QuickPick.openFile('main.go')
  await Editor.switchToTab('go.mod')
  await Editor.shouldHaveCodeLens({ timeout: 120_000 })
  await Notification.closeAll({ force: true })
  await Terminal.killAll()
  await Editor.closeAll()
}

export const run = async ({ Editor, Notification, Terminal }: TestContext): Promise<void> => {
  try {
    await Editor.open('main.go')
    await Editor.open('go.mod')
    await Editor.clickCodeLens('Run govulncheck')
    await Terminal.shouldContainText('govulncheck -C', 120_000)
    await Terminal.shouldContainText(/No vulnerabilities found\.|GO-\d{4}-\d+/, 180_000)
  } finally {
    try {
      await Notification.closeAll({ force: true })
    } finally {
      try {
        await Terminal.killAll()
      } finally {
        await Editor.closeAll()
      }
    }
  }
}

export const teardown = async ({ Editor, Notification, Terminal }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  await Terminal.killAll()
  await Editor.closeAll()
}
