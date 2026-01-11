import * as GetStrings from '../GetStrings/GetStrings.ts'
import * as PrepareHeapSnapshot from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const parseHeapSnapshotNumbers = async (path: string): Promise<{ count: number; heapNumbers: any[] }> => {
  // Use the fast parsing function with Uint32Array for nodes
  // @ts-ignore minimal typing for migration
  const { meta, nodes } = (await PrepareHeapSnapshot.prepareHeapSnapshot(path, {})) as any
  const { node_fields, node_types } = meta

  // Extract strings from the original JSON file since the fast parser doesn't include them
  const strings = await GetStrings.getStrings(path)

  // Work directly with the Uint32Array for maximum performance
  const nodeFieldCount = node_fields.length
  const nodeTypesList = node_types[0]
  const numberTypeIndex = nodeTypesList.indexOf('number')
  const heapNumberStringIndex = strings.indexOf('heap number')

  // Find field indices
  const typeFieldIndex = node_fields.indexOf('type')
  const nameFieldIndex = node_fields.indexOf('name')
  const idFieldIndex = node_fields.indexOf('id')
  const selfSizeFieldIndex = node_fields.indexOf('self_size')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')

  const heapNumbers: any[] = []

  // Iterate through nodes directly in the Uint32Array
  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const typeIndex = nodes[i + typeFieldIndex]
    const nameIndex = nodes[i + nameFieldIndex]

    // Check if this is a number type with "(heap number)" name
    if (typeIndex === numberTypeIndex && nameIndex === heapNumberStringIndex) {
      heapNumbers.push({
        edgeCount: nodes[i + edgeCountFieldIndex],
        id: nodes[i + idFieldIndex],
        name: 'heap number',
        selfSize: nodes[i + selfSizeFieldIndex],
        type: 'number',
      })
    }
  }

  return {
    count: heapNumbers.length,
    heapNumbers: heapNumbers,
  }
}
