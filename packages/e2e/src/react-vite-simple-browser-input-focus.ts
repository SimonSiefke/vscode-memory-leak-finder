import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = true

export const requiresNetwork = true

const browserUrlPattern = /^http:\/\/127\.0\.0\.1:\d+\//
const inputText = 'undo stack smoke value'

let testUrl = ''

const getIndexHtml = (): string => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Vite Input Focus Fixture</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`
}

const getAppSource = (): string => {
  return `export const InputFocusSmoke = ({ React }) => {
  const [isInputMounted, setIsInputMounted] = React.useState(true)
  const [value, setValue] = React.useState('')
  const toggleInput = () => {
    setIsInputMounted((isMounted) => !isMounted)
  }

  return React.createElement(
    'main',
    undefined,
    React.createElement('h1', undefined, 'Input Focus Fixture'),
    isInputMounted
      ? React.createElement(
          'label',
          {
            htmlFor: 'leaky-input',
          },
          'Leaky input',
          React.createElement('input', {
            id: 'leaky-input',
            onChange: (event) => setValue(event.target.value),
            type: 'text',
            value,
          }),
        )
      : null,
    React.createElement(
      'button',
      {
        id: 'toggle-input',
        type: 'button',
        onClick: toggleInput,
      },
      isInputMounted ? 'Unmount input' : 'Mount input',
    ),
    React.createElement(
      'p',
      {
        id: 'input-status',
      },
      isInputMounted ? 'Input mounted' : 'Input unmounted',
    ),
    React.createElement(
      'p',
      {
        id: 'input-value',
      },
      'Input value: ' + value,
    ),
  )
}
`
}

const getMainSource = (): string => {
  return `import React from 'react'
import { createRoot } from 'react-dom/client'
import { InputFocusSmoke } from './app.js'
import './style.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Expected root element')
}

createRoot(root).render(React.createElement(InputFocusSmoke, { React }))
`
}

const getStyleSource = (): string => {
  return `body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

main {
  display: grid;
  gap: 16px;
  padding: 24px;
}

h1,
p {
  margin: 0;
}

label {
  display: grid;
  gap: 8px;
  max-width: 320px;
}

button {
  width: fit-content;
}
`
}

const assertInputMounted = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(() => {
  const input = document.querySelector('#leaky-input')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected leaky input to be mounted')
  }
})()`,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#input-status',
    text: 'Input mounted',
    urlPattern: browserUrlPattern,
  })
}

const focusAndTypeIntoInput = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(() => {
  const input = document.querySelector('#leaky-input')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected leaky input')
  }
  input.focus()
  input.select()
  const inserted = document.execCommand('insertText', false, ${JSON.stringify(inputText)})
  if (!inserted || input.value !== ${JSON.stringify(inputText)}) {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (!valueSetter) {
      throw new Error('Expected input value setter')
    }
    valueSetter.call(input, ${JSON.stringify(inputText)})
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(inputText)}, inputType: 'insertText' }))
  }
  if (document.activeElement !== input) {
    throw new Error('Expected leaky input to be focused')
  }
})()`,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#input-value',
    text: `Input value: ${inputText}`,
    urlPattern: browserUrlPattern,
  })
}

const clickToggleInputButton = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(() => {
  const button = document.querySelector('#toggle-input')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected toggle input button')
  }
  button.click()
})()`,
  })
}

const assertInputUnmounted = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (!document.querySelector('#leaky-input')) {
      return
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected leaky input to be unmounted')
})()`,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#input-status',
    text: 'Input unmounted',
    urlPattern: browserUrlPattern,
  })
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  testUrl = `http://127.0.0.1:${serverPort}/`

  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [
      `--inspect=127.0.0.1:${inspectPort}`,
      './node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(serverPort),
      '--strictPort',
    ],
    connectMemory: false,
    cwd: 'vite-app',
    healthPath: '/health.txt',
    setupCommands: [
      {
        command: 'npx',
        args: ['--yes', 'create-vite@latest', 'vite-app', '--template', 'react'],
      },
      {
        command: 'npm',
        args: ['install', '--package-lock-only'],
        cwd: 'vite-app',
      },
      {
        command: 'npm',
        args: ['ci'],
        cwd: 'vite-app',
      },
    ],
    setupFiles: [
      {
        name: 'vite-app/index.html',
        content: getIndexHtml(),
      },
      {
        name: 'vite-app/src/app.js',
        content: getAppSource(),
      },
      {
        name: 'vite-app/src/main.js',
        content: getMainSource(),
      },
      {
        name: 'vite-app/src/style.css',
        content: getStyleSource(),
      },
      {
        name: 'vite-app/public/health.txt',
        content: 'ok\n',
      },
    ],
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })

  const response = await ExternalRuntime.request('/health.txt')
  assert.strictEqual(response.ok, true)

  await SimpleBrowser.show({
    url: testUrl,
  })
  await assertInputMounted(SimpleBrowser)
}

export const run = async ({ ExternalRuntime, SimpleBrowser }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/health.txt')
  assert.strictEqual(response.ok, true)

  await focusAndTypeIntoInput(SimpleBrowser)
  await clickToggleInputButton(SimpleBrowser)
  await assertInputUnmounted(SimpleBrowser)
  await clickToggleInputButton(SimpleBrowser)
  await assertInputMounted(SimpleBrowser)
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
