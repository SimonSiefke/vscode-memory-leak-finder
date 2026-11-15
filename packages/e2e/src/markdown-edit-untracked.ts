import * as MarkdownEditing from '../helpers/markdownEditing.ts'
import type { TestContext } from '../types.ts'

export const setup = (context: TestContext): Promise<void> => MarkdownEditing.setup(context, { tracked: false, gitEnabled: true })

export const run = MarkdownEditing.run
export const teardown = MarkdownEditing.teardown
