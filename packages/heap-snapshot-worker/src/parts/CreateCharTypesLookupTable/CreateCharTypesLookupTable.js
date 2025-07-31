const charTypes = new Uint8Array(128) // ASCII characters 0-127
const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const OTHER = 0

// Initialize lookup table
for (let i = 0; i < 128; i++) {
  if (i >= 48 && i <= 57) {
    // '0' to '9'
    charTypes[i] = DIGIT
  } else if (i === 44 || i === 32 || i === 9 || i === 10) {
    // comma, space, tab, newline
    charTypes[i] = SEPARATOR
  } else if (i === 93) {
    // ']'
    charTypes[i] = CLOSING_BRACKET
  } else {
    charTypes[i] = OTHER
  }
}

export { charTypes }
