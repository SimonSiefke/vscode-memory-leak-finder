import type { TestContext } from '../../e2e/types.ts'

const wideWidth = 1000
const narrowWidth = 400
const agentsWebContents = 'globalThis._____electron.BrowserWindow.getAllWindows().find(window => window.isVisible()).webContents'

export const setup = async ({ AgentsWindow, Electron }: TestContext): Promise<void> => {
  await AgentsWindow.shouldBeVisible()
  await Electron.setWindowWidth(wideWidth)
  await AgentsWindow.shouldHaveTitleBarAccountWidgetVisibility(true)
}

export const run = async ({ AgentsWindow, Electron }: TestContext): Promise<void> => {
  const zoom = await Electron.evaluate(`${agentsWebContents}.getZoomFactor()`)
  try {
    await Electron.setWindowWidth(narrowWidth)
    // At the desktop minimum width, page zoom makes the title bar overflow.
    await Electron.evaluate(`${agentsWebContents}.setZoomFactor(4)`)
    await AgentsWindow.shouldHaveTitleBarAccountWidgetVisibility(false)
  } finally {
    await Electron.evaluate(`${agentsWebContents}.setZoomFactor(${zoom})`)
    await Electron.setWindowWidth(wideWidth)
  }
  await AgentsWindow.shouldHaveTitleBarAccountWidgetVisibility(true)
}
