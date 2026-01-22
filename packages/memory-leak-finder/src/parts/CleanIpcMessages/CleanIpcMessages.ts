// VSCode binary serialization format
export enum DataType {
  Undefined = 0,
  String = 1,
  Buffer = 2,
  VSBuffer = 3,
  Array = 4,
  Object = 5,
  Int = 6,
}

// Read variable-length quantity (VQL) integer
export function readIntVQL(buffer: Buffer, offset: number): { value: number; bytesRead: number } {
  let value = 0
  let shift = 0
  let bytesRead = 0

  while (true) {
    const byte = buffer[offset + bytesRead]
    bytesRead++
    value |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) break
    shift += 7
  }

  return { value, bytesRead }
}

// Deserialize VSCode binary format
export function deserialize(buffer: Buffer, offset: number = 0): { value: any; bytesRead: number } {
  if (offset >= buffer.length) {
    return { value: undefined, bytesRead: 0 }
  }

  const type = buffer[offset]
  offset++

  switch (type) {
    case DataType.Undefined:
      return { value: undefined, bytesRead: 1 }

    case DataType.String: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const str = buffer.subarray(offset, offset + length).toString('utf8')
      return { value: str, bytesRead: 1 + lengthBytes + length }
    }

    case DataType.Buffer: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const buf = buffer.subarray(offset, offset + length)
      return { value: buf, bytesRead: 1 + lengthBytes + length }
    }

    case DataType.VSBuffer: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const buf = buffer.subarray(offset, offset + length)
      return { value: buf, bytesRead: 1 + lengthBytes + length }
    }

    case DataType.Array: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const result: any[] = []
      let totalBytes = 1 + lengthBytes

      for (let i = 0; i < length; i++) {
        const { value, bytesRead } = deserialize(buffer, offset)
        result.push(value)
        offset += bytesRead
        totalBytes += bytesRead
      }

      return { value: result, bytesRead: totalBytes }
    }

    case DataType.Object: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const json = buffer.subarray(offset, offset + length).toString('utf8')
      return { value: JSON.parse(json), bytesRead: 1 + lengthBytes + length }
    }

    case DataType.Int: {
      const { value, bytesRead } = readIntVQL(buffer, offset)
      return { value, bytesRead: 1 + bytesRead }
    }

    default:
      return { value: undefined, bytesRead: 1 }
  }
}

// Clean up the IPC messages by deserializing VSCode binary data
export function cleanMessages(messages: any[]): any[] {
  return messages.map((msg) => {
    const cleanedMsg = { ...msg }

    // Clean args
    if (msg.args && Array.isArray(msg.args)) {
      cleanedMsg.args = msg.args.map((arg) => {
        // If it's a uint8array with VSCode binary data, try to deserialize it
        if (arg && arg.type === 'uint8array' && arg.content) {
          try {
            // Convert the content string back to a buffer
            // The content is already a string representation of the binary data
            const buffer = Buffer.from(arg.content, 'utf8')
            const { value, bytesRead } = deserialize(buffer)

            // If we successfully deserialized something, return the deserialized value
            if (bytesRead > 0) {
              return {
                type: 'deserialized',
                original: arg,
                value,
              }
            }
          } catch (e) {
            // If deserialization fails, return the original
            return arg
          }
        }
        return arg
      })
    }

    // Clean result (for handle-response)
    if (msg.result && msg.result.type === 'uint8array' && msg.result.content) {
      try {
        const buffer = Buffer.from(msg.result.content, 'utf8')
        const { value, bytesRead } = deserialize(buffer)

        if (bytesRead > 0) {
          cleanedMsg.result = {
            type: 'deserialized',
            original: msg.result,
            value,
          }
        }
      } catch (e) {
        // If deserialization fails, keep the original
      }
    }

    return cleanedMsg
  })
}
