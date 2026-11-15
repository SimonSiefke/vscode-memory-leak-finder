import { SourceMapConsumer } from 'source-map'
import type { OriginalLocation } from '../DuplicateCode/DuplicateCode.ts'
import { addDuplicateCodePreviews } from '../AddDuplicateCodePreviews/AddDuplicateCodePreviews.ts'

export const mapDuplicateCodeLocations = async (
  contents: string,
  positions: readonly number[],
): Promise<readonly (OriginalLocation | null)[]> =>
  SourceMapConsumer.with(contents, null, (consumer) => {
    const locations: (OriginalLocation | null)[] = []
    // One consumer and synchronous, indexed lookups: no per-occurrence RPCs or
    // promises, and no full decoded mappings array.
    for (let index = 0; index < positions.length; index += 2) {
      const original = consumer.originalPositionFor({ line: positions[index], column: positions[index + 1] - 1 })
      locations.push(
        original.source !== null && original.line !== null && original.column !== null
          ? {
              source: original.source,
              line: original.line,
              column: original.column + 1,
              name: original.name,
              preview: null,
            }
          : null,
      )
    }
    addDuplicateCodePreviews(consumer, locations)
    return locations
  })
