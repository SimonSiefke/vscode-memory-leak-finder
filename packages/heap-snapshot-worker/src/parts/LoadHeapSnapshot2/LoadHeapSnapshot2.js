// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license
import { readFile } from 'node:fs/promises'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import { createReadStream } from 'node:fs'
import { HeapSnapshotWriteStream, StringTransform } from '../HeapSnapshotWriteStream/HeapSnaspshotWriteStream.js'
import { pipeline } from 'node:stream/promises'

//  const findToken(token, startIndex)=> {
//     while (true) {
//       const pos = this.#json.indexOf(token, startIndex || 0);
//       if (pos !== -1) {
//         return pos;
//       }
//       startIndex = this.#json.length - token.length + 1;
//       this.#json += await this.#fetchChunk();
//     }
//   }

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export const loadHeapSnapshot2 = async (path) => {
  const snapshotToken = '"snapshot"'

  // const content = await readFile(path, 'utf8')
  const read = createReadStream(path)
  const stringTransform = new StringTransform()
  const write = new HeapSnapshotWriteStream()
  await pipeline(read, stringTransform, write)
  // const value = JSON.parse(content)
  // const mergedStrings = value.strings.join('\n')
  // value.merged = mergedStrings
  // // const efficient = makeMemoryEfficient(value)
  // HeapSnapshotState.set(path, value)
}
