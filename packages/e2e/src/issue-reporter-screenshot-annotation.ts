import type { TestContext } from '../types.ts'

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
