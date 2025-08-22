const charTypes = new Uint8Array(128) // ASCII characters 0-127
const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const MINUS = 4
const OTHER = 0

// Character code constants for better readability
const CHAR_0 = '0'.charCodeAt(0)
const CHAR_9 = '9'.charCodeAt(0)
const CHAR_COMMA = ','.charCodeAt(0)
const CHAR_SPACE = ' '.charCodeAt(0)
const CHAR_TAB = '\t'.charCodeAt(0)
const CHAR_NEWLINE = '\n'.charCodeAt(0)
const CHAR_CLOSING_BRACKET = ']'.charCodeAt(0)
const CHAR_MINUS = '-'.charCodeAt(0)

// Initialize lookup table
for (let i = 0; i < 128; i++) {
  if (i >= CHAR_0 && i <= CHAR_9) {
    charTypes[i] = DIGIT
  } else
    switch (i) {
      case CHAR_COMMA:
      case CHAR_SPACE:
      case CHAR_TAB:
      case CHAR_NEWLINE: {
        charTypes[i] = SEPARATOR

        break
      }
      case CHAR_CLOSING_BRACKET: {
        charTypes[i] = CLOSING_BRACKET

        break
      }
      case CHAR_MINUS: {
        charTypes[i] = MINUS

        break
      }
      default: {
        charTypes[i] = OTHER
      }
    }
}

export { charTypes }
