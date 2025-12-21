import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ SideBar }: TestContext) => {
  await SideBar.hide()
}

export const run = async ({ ActivityBar, SideBar }: TestContext): Promise<void> => {
  await ActivityBar.showExplorer()
  await SideBar.hide()
  await ActivityBar.showSearch()
  await SideBar.hide()
  await ActivityBar.showSourceControl()
  await SideBar.hide()
  await ActivityBar.showRunAndDebug()
  await SideBar.hide()
  await ActivityBar.showExtensions()
  await SideBar.hide()
  await ActivityBar.showExplorer()
  await SideBar.hide()
}
