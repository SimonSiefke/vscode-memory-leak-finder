import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = true

export const requiresNetwork = true

const collapsedCheckboxCount = 2
const expandedCheckboxCount = 5
const browserUrlPattern = /^http:\/\/127\.0\.0\.1:\d+\//

let testUrl = ''

const getCountText = (count: number): string => `Checkbox count: ${count}`

const getIndexHtml = (): string => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue Vite Checkbox Fixture</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`
}

const getAppSource = (): string => {
  return `import { h } from 'vue'

const collapsedCheckboxCount = ${collapsedCheckboxCount}
const expandedCheckboxCount = ${expandedCheckboxCount}

export const CheckboxCounter = {
  data() {
    return {
      checkboxCount: collapsedCheckboxCount,
    }
  },
  methods: {
    toggleCheckboxCount() {
      this.checkboxCount = this.checkboxCount === collapsedCheckboxCount ? expandedCheckboxCount : collapsedCheckboxCount
    },
  },
  render() {
    const checkboxes = Array.from({ length: this.checkboxCount }, (_, index) => {
      return h(
        'label',
        {
          class: 'checkbox-row',
          key: index,
        },
        [
          h('input', {
            type: 'checkbox',
            'aria-label': 'Fixture checkbox ' + (index + 1),
          }),
          ' Checkbox ' + (index + 1),
        ],
      )
    })

    return h(
      'main',
      undefined,
      [
        h('h1', undefined, 'Checkbox Fixture'),
        h(
          'button',
          {
            id: 'toggle-checkbox-count',
            type: 'button',
            onClick: this.toggleCheckboxCount,
          },
          this.checkboxCount === collapsedCheckboxCount ? 'Show more checkboxes' : 'Show fewer checkboxes',
        ),
        h(
          'p',
          {
            id: 'checkbox-count',
          },
          'Checkbox count: ' + this.checkboxCount,
        ),
        h(
          'section',
          {
            'aria-label': 'Checkboxes',
          },
          checkboxes,
        ),
      ],
    )
  },
}
`
}

const getMainSource = (): string => {
  return `import { createApp } from 'vue'
import { CheckboxCounter } from './app.js'
import './style.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Expected root element')
}

createApp(CheckboxCounter).mount(root)
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

section {
  display: grid;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  gap: 8px;
}
`
}

const clickToggleButton = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(() => {
  const button = document.querySelector('#toggle-checkbox-count')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected toggle checkbox count button')
  }
  button.click()
})()`,
  })
}

const assertCheckboxCount = async (SimpleBrowser: TestContext['SimpleBrowser'], expected: number): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  let actual = 0
  for (let attempt = 0; attempt < 60; attempt++) {
    actual = document.querySelectorAll('input[type="checkbox"]').length
    if (actual === ${expected}) {
      return
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected ${expected} checkboxes, found ' + actual)
})()`,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#checkbox-count',
    text: getCountText(expected),
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
        args: ['--yes', 'create-vite@latest', 'vite-app', '--template', 'vue'],
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
  await assertCheckboxCount(SimpleBrowser, collapsedCheckboxCount)
}

export const run = async ({ ExternalRuntime, SimpleBrowser }: TestContext): Promise<void> => {
  const response = await ExternalRuntime.request('/health.txt')
  assert.strictEqual(response.ok, true)

  await clickToggleButton(SimpleBrowser)
  await assertCheckboxCount(SimpleBrowser, expandedCheckboxCount)
  await clickToggleButton(SimpleBrowser)
  await assertCheckboxCount(SimpleBrowser, collapsedCheckboxCount)
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
