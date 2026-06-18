import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = true

export const requiresNetwork = true

const browserUrlPattern = /^http:\/\/127\.0\.0\.1:\d+\//
const inputText = 'undo stack repro value'
const inputsPerRun = 4

let testUrl = ''

const getStatusText = (createdInputCount: number): string => {
  return `Created inputs: ${createdInputCount}; Active inputs: 0`
}

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
  const [activeInputId, setActiveInputId] = React.useState(null)
  const [createdInputCount, setCreatedInputCount] = React.useState(0)
  const [value, setValue] = React.useState('')
  const createInput = () => {
    setValue('')
    setCreatedInputCount((count) => {
      setActiveInputId(count)
      return count + 1
    })
  }
  const removeInput = () => {
    setActiveInputId(null)
    setValue('')
  }
  const isInputMounted = activeInputId !== null

  function retainedInputChangeHandler(event) {
    const nextValue = event.target.value
    window.__lastChangedLeakyInput = activeInputId
    setValue(nextValue)
  }

  function retainedInputFocusHandler() {
    window.__lastFocusedLeakyInput = activeInputId
  }

  return React.createElement(
    'main',
    undefined,
    React.createElement('h1', undefined, 'Input Focus Fixture'),
    React.createElement(
      'button',
      {
        id: 'create-input',
        type: 'button',
        onClick: createInput,
      },
      'Create input',
    ),
    isInputMounted
      ? React.createElement(
          'label',
          {
            className: 'input-row',
            htmlFor: 'leaky-input',
            key: 'leaky-input-' + activeInputId,
          },
          'Leaky input ' + activeInputId,
          React.createElement('input', {
            'data-created-input-id': String(activeInputId),
            id: 'leaky-input',
            onChange: retainedInputChangeHandler,
            onFocus: retainedInputFocusHandler,
            type: 'text',
            value,
          }),
        )
      : null,
    isInputMounted
      ? React.createElement(
          'button',
          {
            id: 'remove-input',
            type: 'button',
            onClick: removeInput,
          },
          'Remove input',
        )
      : null,
    React.createElement(
      'p',
      {
        id: 'input-status',
      },
      'Created inputs: ' + createdInputCount + '; Active inputs: ' + (isInputMounted ? 1 : 0),
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

button {
  width: fit-content;
}

.input-row {
  display: grid;
  gap: 8px;
  max-width: 320px;
}
`
}

const assertNoInputMounted = async (SimpleBrowser: TestContext['SimpleBrowser'], createdInputCount: number): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(() => {
  const input = document.querySelector('#leaky-input')
  if (input) {
    throw new Error('Expected no active leaky input')
  }
})()`,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#input-status',
    text: getStatusText(createdInputCount),
    urlPattern: browserUrlPattern,
  })
}

const createInput = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  const button = document.querySelector('#create-input')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected create input button')
  }
  button.click()
  for (let attempt = 0; attempt < 60; attempt++) {
    const input = document.querySelector('#leaky-input')
    if (input instanceof HTMLInputElement) {
      return Number(input.dataset.createdInputId)
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected leaky input to be mounted')
})()`,
  })
}

const focusTypeAndRemoveInput = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  const input = document.querySelector('#leaky-input')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected leaky input')
  }
  const inputId = input.dataset.createdInputId || 'unknown'
  const text = ${JSON.stringify(inputText)} + ' ' + inputId
  input.focus()
  input.select()
  const inserted = document.execCommand('insertText', false, text)
  if (!inserted || input.value !== text) {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (!valueSetter) {
      throw new Error('Expected input value setter')
    }
    valueSetter.call(input, text)
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }))
  }
  if (document.activeElement !== input) {
    throw new Error('Expected leaky input to be focused')
  }
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const removeButton = document.querySelector('#remove-input')
  if (!(removeButton instanceof HTMLButtonElement)) {
    throw new Error('Expected remove input button')
  }
  removeButton.click()
  for (let attempt = 0; attempt < 60; attempt++) {
    if (!document.querySelector('#leaky-input')) {
      return
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected leaky input to be unmounted')
})()`,
  })
}

const createFocusTypeAndRemoveInput = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await createInput(SimpleBrowser)
  await focusTypeAndRemoveInput(SimpleBrowser)
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
  await assertNoInputMounted(SimpleBrowser, 0)
}

export const run = async ({ ExternalRuntime, SimpleBrowser }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/health.txt')
  assert.strictEqual(response.ok, true)

  for (let i = 0; i < inputsPerRun; i++) {
    await createFocusTypeAndRemoveInput(SimpleBrowser)
  }
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
