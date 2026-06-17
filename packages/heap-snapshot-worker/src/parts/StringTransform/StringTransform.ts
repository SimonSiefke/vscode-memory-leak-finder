import { Transform } from 'node:stream'
import type { TransformCallback } from 'node:stream'

export class StringTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }
<<<<<<< HEAD
  _transform(chunk: any, encoding: any, callback: any) {
=======
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
>>>>>>> origin/main
    const string = chunk.toString()
    this.push(string)
    callback()
  }
}
