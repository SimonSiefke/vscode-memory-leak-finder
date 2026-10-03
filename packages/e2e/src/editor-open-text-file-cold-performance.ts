import type { TestContext } from '../types.ts'
import { createEditorOpenPerformanceScenario, setupEditorOpenPerformanceScenario } from './editor-open-text-file-performance-scenario.ts'

export const skip = 1

export const setup = setupEditorOpenPerformanceScenario

export const performanceScenario = createEditorOpenPerformanceScenario('cold')

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
