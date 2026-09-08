import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor, Workbench }: TestContext): Promise<void> => {
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'telemetry.feedback.enabled', resultCount: 1 })
  await SettingsEditor.enableCheckBox({ name: 'telemetry.feedback.enabled' })
  await Editor.closeAll()
  // Reporter commands are registered at startup, so enabling feedback requires a reload.
  await Workbench.reload()
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

export const teardown = async ({ Editor, SettingsEditor, Workbench }: TestContext): Promise<void> => {
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'telemetry.feedback.enabled', resultCount: 1 })
  await SettingsEditor.disableCheckBox({ name: 'telemetry.feedback.enabled' })
  await Editor.closeAll()
  await Workbench.reload()
}
