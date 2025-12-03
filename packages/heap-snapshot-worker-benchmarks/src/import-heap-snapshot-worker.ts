const heapSnapshotWorkerBaseUrl = new URL(
  '../../heap-snapshot-worker/src',
  import.meta.url
).href

export const importHeapSnapshotWorker = async (
  relativePath: string
): Promise<any> => {
  const url = new URL(relativePath, heapSnapshotWorkerBaseUrl).href
  return await import(url)
}
