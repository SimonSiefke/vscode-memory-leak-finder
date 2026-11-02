import * as MarkdownTyping from '../helpers/markdownTyping.ts'
import type { TestContext } from '../types.ts'

// Retains undo history intentionally; opt in for growth measurements.
export const skip = 1

export const setup = (context: TestContext): Promise<void> => MarkdownTyping.setup(context, { tracked: true, gitEnabled: true })

export const run = MarkdownTyping.run
export const teardown = MarkdownTyping.teardown
