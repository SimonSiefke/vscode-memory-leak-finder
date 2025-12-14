export const collectLeakedNodeByteOffsets = (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
): Set<number> => {
  const leakedNodeByteOffsets = new Set<number>()
  for (const closures of Object.values(leakedClosures)) {
    for (const closure of closures) {
      // nodeIndex is already a byte offset
      leakedNodeByteOffsets.add(closure.nodeIndex)
    }
  }
  return leakedNodeByteOffsets
}
