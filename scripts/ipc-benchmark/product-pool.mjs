import { Buffer } from 'node:buffer'
// Match Linux src/bootstrap-node.ts; consume any earlier runtime-created slab.
Buffer.poolSize = 8 * 1024
for (let i = 0; i < 256; i++) {
  if (Buffer.allocUnsafe(512).buffer.byteLength === Buffer.poolSize) break
}
if (Buffer.allocUnsafe(8).buffer.byteLength !== 8192) throw new Error('Expected the product 8 KiB Buffer pool')
