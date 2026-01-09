import { createHash } from 'node:crypto'

export const normalizeRequestBody = (body: Buffer): Buffer => {
  try {
    const bodyString = body.toString('utf8')
    const parsed = JSON.parse(bodyString)

    // Check if body has an 'input' property that is an array
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.input)) {
      // Create a copy to avoid mutating the original
      const normalized = { ...parsed }
      const inputArray = [...parsed.input]

      // Filter out entries with type: "reasoning"
      const filteredInput = inputArray.filter((entry: any) => entry.type !== 'reasoning')

      // Build a map of original call_id to normalized call_id
      const callIdMap = new Map<string, string>()
      let callCounter = 1

      // First pass: collect all function_call entries and assign normalized IDs
      for (const entry of filteredInput) {
        if (entry.type === 'function_call' && entry.call_id) {
          const normalizedId = `call_${callCounter}`
          callIdMap.set(entry.call_id, normalizedId)
          callCounter++
        }
      }

      // Second pass: normalize all entries
      const normalizedInput = filteredInput.map((entry: any) => {
        const normalizedEntry = { ...entry }

        // Normalize function_call call_id
        if (entry.type === 'function_call' && entry.call_id) {
          const normalizedId = callIdMap.get(entry.call_id)
          if (normalizedId) {
            normalizedEntry.call_id = normalizedId
          }
        }

        // Normalize function_call_output call_id
        if (entry.type === 'function_call_output' && entry.call_id) {
          const normalizedId = callIdMap.get(entry.call_id)
          if (normalizedId) {
            normalizedEntry.call_id = normalizedId
          }
        }

        return normalizedEntry
      })

      normalized.input = normalizedInput
      return Buffer.from(JSON.stringify(normalized), 'utf8')
    }

    // If not the expected structure, return original body
    return body
  } catch {
    // If parsing fails, return original body
    return body
  }
}

export const hashRequestBody = (body: Buffer): string => {
  const normalizedBody = normalizeRequestBody(body)
  return createHash('sha256').update(normalizedBody).digest('hex').slice(0, 16)
}
