import type { TestContext } from '../types.ts'

let feedbackEnabled: boolean | undefined

export const setup = async ({ Editor, IssueReporter, Workbench }: TestContext): Promise<void> => {
  await Editor.closeAll()
  feedbackEnabled = await IssueReporter.setFeedbackEnabled(true)
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

export const teardown = async ({ IssueReporter, Workbench }: TestContext): Promise<void> => {
  await IssueReporter.setFeedbackEnabled(feedbackEnabled)
  await Workbench.reload()
}
