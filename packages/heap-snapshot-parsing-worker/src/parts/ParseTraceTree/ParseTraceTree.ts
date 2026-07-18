const getRecord = (value: readonly unknown[], recordLength: number): readonly number[] => {
  const record: number[] = []
  for (let i = 0; i < recordLength; i++) {
    const item = value[i]
    record.push(typeof item === 'number' ? item : 0)
  }
  return record
}

const flattenNode = (value: unknown, recordLength: number, output: number[]): void => {
  if (!Array.isArray(value) || value.length < recordLength) {
    return
  }
  output.push(...getRecord(value, recordLength))
  const children = value[recordLength]
  if (!Array.isArray(children)) {
    return
  }
  for (const child of children) {
    flattenNode(child, recordLength, output)
  }
}

export const parseTraceTree = (value: unknown, traceNodeFields: readonly string[]): Uint32Array => {
  const childrenIndex = traceNodeFields.indexOf('children')
  const recordLength = childrenIndex === -1 ? traceNodeFields.length : childrenIndex
  if (recordLength === 0) {
    return new Uint32Array()
  }
  const output: number[] = []
  flattenNode(value, recordLength, output)
  return Uint32Array.from(output)
}
