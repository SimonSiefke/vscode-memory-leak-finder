import type { TestContext } from '../types.ts'

export const skip = false

export const requiresNetwork = true

export const setup = async ({ Editor, Explorer, Terminal, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Terminal.killAll()
  await Editor.closeAll()
  await Explorer.focus()
}

export const run = async ({ ActivityBar, Editor, Explorer, Terminal, Workspace, SimpleBrowser, Task }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Terminal.killAll()
  await Explorer.focus()
  // Show terminal and create Vite React project
  await Terminal.show({
    waitForReady: true,
  })
  // Create Vite React project
  await Terminal.execute(' npm create vite@latest my-vite-app -- --template react-ts --no-interactive', {
    waitForFile: 'my-vite-app/package.json',
  })

  // Navigate to project directory
  await Terminal.execute('cd my-vite-app', {})

  // Install dependencies
  await Terminal.execute('npm install', {
    waitForFile: 'my-vite-app/node_modules/.package-lock.json',
  })

  // Create task configuration for running Vite
  await Workspace.add({
    content: `{
  "version": "0.2.0",
  "tasks": [
    {
      "type": "npm",
      "script": "dev",
      "path": "my-vite-app",
      "problemMatcher": [
        {
          "owner": "vite",
          "fileLocation": ["relative", "\${workspaceFolder}/my-vite-app"],
          "pattern": {
            "regexp": "^.*$",
            "message": 1
          },
          "background": {
            "activeOnStart": true,
            "beginsPattern": "^.*$",
            "endsPattern": "^.*$"
          }
        }
      ],
      "isBackground": true,
      "label": "npm: dev - my-vite-app"
    }
  ]
}`,
    name: '.vscode/tasks.json',
  })

  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('my-vite-app')
  // Open the App.tsx file
  await Explorer.expand('my-vite-app')
  await Editor.open('App.tsx')

  // Show Run and Debug view
  await ActivityBar.showRunAndDebug()

  // @ts-ignore
  await Task.run('npm: dev - my-vite-app', false)

  // TODO wait on port instead
  // Wait for the server to start
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Open the browser to verify the app is running
  await SimpleBrowser.show({
    url: 'http://localhost:5173',
  })

  // TODO verify h1 is displayed

  // Edit App.tsx to change the content
  await Editor.open('App.tsx')
  await Editor.deleteAll()
  await Editor.type(`import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>TEST EDITED APP</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App`)

  // Save the file to trigger HMR
  await Editor.save({ viaKeyBoard: true })

  // Wait a bit for HMR to update
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Verify the updated h1 content
  // await innerFrame.waitForIdle()
  // await expect(h1).toHaveText('TEST EDITED APP')

  // Stop any running tasks
  await Task.clear()
  // Close all editors
  await Editor.closeAll()

  // Kill all terminals
  await Terminal.killAll()

  await Workspace.setFiles([])
}

export const teardown = async ({ Editor, Task, Terminal, Workspace }: TestContext): Promise<void> => {
  // Stop any running tasks
  await Task.clear()
  // Close all editors
  await Editor.closeAll()

  // Kill all terminals
  await Terminal.killAll()

  await Workspace.setFiles([])
}
