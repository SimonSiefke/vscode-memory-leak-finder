const getRecord = (value: readonly unknown[], recordLength: number): readonly number[] => {
  const record: number[] = []
  for (let i = 0; i < recordLength; i++) {
    const item = value[i]
    record.push(typeof item === 'number' ? item : 0)
  }
  return record
}

interface ParsedTraceTree {
  readonly parents: Uint32Array
  readonly tree: Uint32Array
}

const flattenNode = (
  value: unknown,
  recordLength: number,
  idOffset: number,
  parentId: number,
  output: number[],
  parents: number[],
): void => {
  if (!Array.isArray(value) || value.length < recordLength) {
    return
  }
  const record = getRecord(value, recordLength)
  output.push(...record)
  parents.push(parentId)
  const children = value[recordLength]
  if (!Array.isArray(children)) {
    return
  }
  const id = idOffset === -1 ? 0 : record[idOffset]
  if (Array.isArray(children[0])) {
    for (const child of children) {
      flattenNode(child, recordLength, idOffset, id, output, parents)
    }
    return
  }
  const childRecordLength = recordLength + 1
  for (let offset = 0; offset + recordLength < children.length; offset += childRecordLength) {
    flattenNode(children.slice(offset, offset + childRecordLength), recordLength, idOffset, id, output, parents)
  }
}

export const parseTraceTreeWithParents = (value: unknown, traceNodeFields: readonly string[]): ParsedTraceTree => {
  const childrenIndex = traceNodeFields.indexOf('children')
  const recordLength = childrenIndex === -1 ? traceNodeFields.length : childrenIndex
  if (recordLength === 0) {
    return {
      parents: new Uint32Array(),
      tree: new Uint32Array(),
    }
  }
  const output: number[] = []
  const parents: number[] = []
  flattenNode(value, recordLength, traceNodeFields.indexOf('id'), 0, output, parents)
  return {
    parents: Uint32Array.from(parents),
    tree: Uint32Array.from(output),
  }
}

export const parseTraceTree = (value: unknown, traceNodeFields: readonly string[]): Uint32Array => {
  return parseTraceTreeWithParents(value, traceNodeFields).tree
}
