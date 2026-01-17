import { Transform } from 'node:stream'

export class StringTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }
  _transform(chunk: any, encoding: any, callback: any) {
    const string = chunk.toString()
    this.push(string)
    callback()
  }
}
