import assert from 'node:assert'
import type { TestContext } from '../types.js'

type VisualEditor = TestContext['Editor'] & {
  shouldHaveText(text: string, fileName?: string, groupId?: number): Promise<void>
}

type VisualTerminal = TestContext['Terminal'] & {
  pressEnter(): Promise<void>
}

type VisualTestContext = Omit<TestContext, 'Editor' | 'Terminal'> & {
  Editor: VisualEditor
  Terminal: VisualTerminal
}

export const skip = false

export const requiresNetwork = true

const initialHeading = 'next visual hot reload phase 1'
const updatedHeading = 'next visual hot reload phase 2'
const appDir = 'next-app'
const pagePath = `${appDir}/app/page.js`

const createNextAppCommand = 'npx --yes create-next-app@latest next-app --yes --use-npm --js --app --eslint --no-tailwind --skip-install'

const getLayoutContent = (): string => {
  return `export const metadata = {
  title: 'next visual hot reload',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
}

const getPageContent = (heading: string): string => {
  return `export default function HomePage() {
  return (
    <main>
      <h1>${heading}</h1>
      <p>simple next hot reload fixture</p>
      <p>Edit app/page.js to update this page.</p>
    </main>
  )
}
`
}

export const setup = async ({ Editor, Explorer, Terminal, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Terminal.killAll()
  await Editor.closeAll()
  await Explorer.focus()
}

export const run = async ({ Editor, ExternalRuntime, Panel, SimpleBrowser, Terminal, Workspace }: VisualTestContext): Promise<void> => {
  const { serverPort } = await ExternalRuntime.createPorts()

  await Terminal.show({
    waitForReady: true,
  })

  await Terminal.type(createNextAppCommand)
  await Terminal.pressEnter()
  assert.strictEqual(await Workspace.waitForFile(`${appDir}/package.json`), true)

  await Workspace.add({
    name: `${appDir}/app/layout.js`,
    content: getLayoutContent(),
  })
  await Workspace.add({
    name: pagePath,
    content: getPageContent(initialHeading),
  })

  await Terminal.type(`cd ${appDir}`)
  await Terminal.pressEnter()

  await Terminal.type('npm install --package-lock-only')
  await Terminal.pressEnter()
  assert.strictEqual(await Workspace.waitForFile(`${appDir}/package-lock.json`), true)

  await Terminal.type('npm ci')
  await Terminal.pressEnter()
  assert.strictEqual(await Workspace.waitForFile(`${appDir}/node_modules/next/package.json`), true)

  await Terminal.type(`npm run dev -- --hostname 127.0.0.1 --port ${serverPort}`)
  await Terminal.pressEnter()

  await Panel.hide()

  await Editor.open('page.js')
  await Editor.shouldHaveText(getPageContent(initialHeading), pagePath, 1)
  await Editor.splitRight()
  await Editor.focusRightEditorGroup()

  await SimpleBrowser.show({
    port: serverPort,
  })
  await SimpleBrowser.shouldHaveText({
    text: initialHeading,
  })

  await Editor.focusLeftEditorGroup()
  await Editor.shouldHaveText(getPageContent(initialHeading), pagePath, 1)
  await Editor.deleteAll()
  await Editor.type(getPageContent(updatedHeading))
  await Editor.save({
    viaKeyBoard: true,
  })

  await SimpleBrowser.shouldHaveText({
    text: updatedHeading,
  })
}

export const teardown = async ({ Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
