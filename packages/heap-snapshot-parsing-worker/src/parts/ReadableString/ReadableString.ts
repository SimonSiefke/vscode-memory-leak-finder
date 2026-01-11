import { Readable } from 'node:stream'

class ReadableString extends Readable {
  str: string
  sent: boolean

  constructor(str: string) {
    super()
    this.str = str
    this.sent = false
  }

  _read() {
    if (this.sent) {
      this.push(null)
    } else {
      this.push(Buffer.from(this.str))
      this.sent = true
    }
  }
}

export const createReadableString = (string: string): ReadableString => {
  return new ReadableString(string)
}
