import { Readable } from 'node:stream'

class ReadableString extends Readable {
  str: any
  sent: boolean

  constructor(str) {
    super()
    this.str = str
    this.sent = false
  }

  _read() {
    if (!this.sent) {
      this.push(Buffer.from(this.str))
      this.sent = true
    } else {
      this.push(null)
    }
  }
}

export const createReadableString = (string) => {
  return new ReadableString(string)
}
