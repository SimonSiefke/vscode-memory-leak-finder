import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const parseHeapSnapshotStringsCount = async (path: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { strings } = snapshot as any
  return strings.length
}
