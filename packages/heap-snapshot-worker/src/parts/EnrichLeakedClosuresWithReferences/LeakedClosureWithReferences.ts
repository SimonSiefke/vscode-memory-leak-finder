import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly ReferencePath[]
}
