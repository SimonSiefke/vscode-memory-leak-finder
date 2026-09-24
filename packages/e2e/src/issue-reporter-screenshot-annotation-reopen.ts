import type { TestContext } from '../types.ts'

export const setup = async ({ IssueReporter }: TestContext): Promise<void> => {
  await IssueReporter.open()
  await IssueReporter.captureScreenshot()
  await IssueReporter.editAnnotationText('Initial annotation', 'commit')
  await IssueReporter.finishAnnotation('Save')
}

export const run = async ({ IssueReporter }: TestContext): Promise<void> => {
  await IssueReporter.reopenScreenshot()
  await IssueReporter.editAnnotationText('Committed annotation', 'commit')
  await IssueReporter.editAnnotationText('Cancelled annotation', 'cancel')
  await IssueReporter.editAnnotationText('Blurred annotation', 'blur')
  await IssueReporter.finishAnnotation('Save')
  await IssueReporter.reopenScreenshot()
  await IssueReporter.editAnnotationText('Discarded annotation', 'commit')
  await IssueReporter.finishAnnotation('Discard')
}

export const teardown = async ({ IssueReporter }: TestContext): Promise<void> => {
  await IssueReporter.close()
}
