const charTypes = new Uint8Array(128) // ASCII characters 0-127
const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const OTHER = 0

// Character code constants for better readability
const CHAR_0 = '0'.charCodeAt(0)
const CHAR_9 = '9'.charCodeAt(0)
const CHAR_COMMA = ','.charCodeAt(0)
const CHAR_SPACE = ' '.charCodeAt(0)
const CHAR_TAB = '\t'.charCodeAt(0)
const CHAR_NEWLINE = '\n'.charCodeAt(0)
const CHAR_CLOSING_BRACKET = ']'.charCodeAt(0)

// Initialize lookup table
for (let i = 0; i < 128; i++) {
  if (i >= CHAR_0 && i <= CHAR_9) {
    // '0' to '9'
    charTypes[i] = DIGIT
  } else if (i === CHAR_COMMA || i === CHAR_SPACE || i === CHAR_TAB || i === CHAR_NEWLINE) {
    // comma, space, tab, newline
    charTypes[i] = SEPARATOR
  } else if (i === CHAR_CLOSING_BRACKET) {
    // ']'
    charTypes[i] = CLOSING_BRACKET
  } else {
    charTypes[i] = OTHER
  }
}

export { charTypes }
