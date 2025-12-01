import { Transform } from 'node:stream'

export class StringTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }
  _transform(chunk, encoding, callback) {
    const string = chunk.toString()
    this.push(string)
    callback()
  }
}
