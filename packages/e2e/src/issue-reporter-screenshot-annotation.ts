import type { TestContext } from '../types.ts'

let originalSettings: Record<string, unknown>

export const setup = async ({ Editor, QuickPick, Workbench, Workspace }: TestContext): Promise<void> => {
  originalSettings = await Workspace.readWorkspaceSettings()
  await Workspace.updateWorkspaceSettings({ 'telemetry.feedback.enabled': true })
  // Reporter commands are registered at startup, so enabling feedback requires a reload.
  await QuickPick.showCommands()
  await QuickPick.type('Reload Window')
  throw new Error(JSON.stringify(await Workbench.evaluate({ expression: `JSON.stringify([...document.querySelectorAll('.quick-input-widget .label-name')].map(e => ({text: e.textContent, visible: e.checkVisibility(), display: getComputedStyle(e).display, bounds: e.getBoundingClientRect().toJSON()})))`, returnByValue: true })))
  await Workbench.reload()
  await Editor.closeAll()
}

export const run = async ({ IssueReporter }: TestContext): Promise<void> => {
  await IssueReporter.open()
  try {
    await IssueReporter.captureScreenshot()
    await IssueReporter.editAnnotationText('Committed annotation', 'commit')
    await IssueReporter.editAnnotationText('Cancelled annotation', 'cancel')
    await IssueReporter.editAnnotationText('Blurred annotation', 'blur')
    await IssueReporter.finishAnnotation('Save')
    await IssueReporter.reopenScreenshot()
    await IssueReporter.editAnnotationText('Discarded annotation', 'commit')
    await IssueReporter.finishAnnotation('Discard')
  } finally {
    await IssueReporter.close()
  }
}

export const teardown = async ({ Workbench, Workspace }: TestContext): Promise<void> => {
  await Workspace.writeWorkspaceSettings(originalSettings)
  await Workbench.reload()
}
