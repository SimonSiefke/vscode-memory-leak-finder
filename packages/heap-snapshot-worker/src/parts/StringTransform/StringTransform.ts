import { Transform } from 'node:stream'
import type { TransformCallback } from 'node:stream'

export class StringTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    const string = chunk.toString()
    this.push(string)
    callback()
  }
}
