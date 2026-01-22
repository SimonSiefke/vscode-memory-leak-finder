import type { TestContext } from '../types.ts'

export const skip = false

export const requiresNetwork = true

export const setup = async ({ Editor, Explorer, RunAndDebug, Terminal, Workspace }: TestContext): Promise<void> => {
  // Kill any existing terminals
  await Terminal.killAll()

  // Set up empty workspace
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()

  // Show terminal and create Vite React project
  await Terminal.show({
    waitForReady: true,
  })

  // Create Vite React project
  await Terminal.execute(' npm create vite@latest my-vite-app -- --template react --no-interactive', {
    waitForFile: 'my-vite-app/package.json',
  })

  // Navigate to project directory
  await Terminal.execute('cd my-vite-app', {})

  // Install dependencies
  await Terminal.execute('npm install', {
    waitForFile: 'my-vite-app/node_modules/.package-lock.json',
  })

  // Create launch configuration for debugging
  await Workspace.setFiles([
    {
      content: `{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Vite React App",
      "url": "http://localhost:5173",
      "webRoot": "\${workspaceFolder}/my-vite-app",
      "sourceMaps": true,
      "skipFiles": ["**/node_modules/**"],
      "preLaunchTask": "npm: dev - my-vite-app"
    }
  ]
}`,
      name: '.vscode/launch.json',
    },
    {
      content: `{
  "version": "0.2.0",
  "tasks": [
    {
      "type": "npm",
      "script": "dev",
      "path": "my-vite-app",
      "problemMatcher": [],
      "isBackground": true,
      "label": "npm: dev - my-vite-app"
    }
  ]
}`,
      name: '.vscode/tasks.json',
    },
  ])

  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('my-vite-app')
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ ActivityBar, Editor, Explorer, RunAndDebug, SimpleBrowser }: TestContext): Promise<void> => {
  // Open the App.tsx file
  await Explorer.expand('my-vite-app')
  await Explorer.expand('my-vite-app/src')
  await Editor.open('my-vite-app/src/App.tsx')

  // Set a breakpoint in App.tsx
  await Editor.setBreakpoint(10)

  // Show Run and Debug view
  await ActivityBar.showRunAndDebug()

  // Start debugging
  await RunAndDebug.runAndWaitForPaused({
    debugLabel: 'Debug Vite React App',
    file: 'App.tsx',
    line: 10,
    viaIcon: true,
  })

  // Open the browser to verify the app is running
  await SimpleBrowser.show({
    url: 'http://localhost:5173',
  })

  // Edit App.tsx to change the content
  await Editor.open('my-vite-app/src/App.tsx')
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

  // Save the file
  await Editor.save({})

  // Continue execution
  await RunAndDebug.continue()

  // Wait a bit for the browser to update
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Stop debugging
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
}

export const teardown = async ({ Editor, RunAndDebug, Terminal, Workspace }: TestContext): Promise<void> => {
  // Stop any running debug sessions
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()

  // Kill all terminals
  await Terminal.killAll()

  // Close all editors
  await Editor.closeAll()

  // Clean up the workspace
  await Workspace.remove('my-vite-app')
  await Workspace.remove('.vscode/launch.json')
  await Workspace.remove('.vscode/tasks.json')
}
