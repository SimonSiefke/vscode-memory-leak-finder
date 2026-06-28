export const getMonkeyPatchElectronSafeStorageScript = ({ secretsPath }: { secretsPath: string }): string => `function () {
  const electron = globalThis._____electron || globalThis.__electron || this
  const globalRequire = globalThis._____require || globalThis.___require
  const nodeRequire =
    typeof globalRequire === 'function'
      ? globalRequire
      : typeof require === 'function'
        ? require
      : typeof process !== 'undefined' && process.mainModule && process.mainModule.require
        ? process.mainModule.require.bind(process.mainModule)
        : undefined

  const fs = nodeRequire ? nodeRequire('node:fs') : undefined
  const path = nodeRequire ? nodeRequire('node:path') : undefined
  const secretsPath = ${JSON.stringify(secretsPath)}
  const logPath = path ? path.join(path.dirname(secretsPath), 'secrets-log.txt') : ''

  const initializeSecretsFile = () => {
    if (!fs || !path) {
      return
    }
    try {
      fs.mkdirSync(path.dirname(secretsPath), { recursive: true })
      if (!fs.existsSync(secretsPath)) {
        fs.writeFileSync(secretsPath, JSON.stringify({}, null, 2) + '\\n', 'utf8')
      }
    } catch {
      // ignore secrets file initialization errors
    }
  }

  const initializeLogFile = () => {
    if (!fs || !path || !logPath) {
      return
    }
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true })
      fs.writeFileSync(logPath, '', 'utf8')
    } catch {
      // ignore log initialization errors
    }
  }

  const log = (message) => {
    if (!fs || !path || !logPath) {
      return
    }
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true })
      fs.appendFileSync(logPath, message + '\\n', 'utf8')
    } catch {
      // ignore logging errors
    }
  }

  const readSecrets = () => {
    if (!fs) {
      return {}
    }
    try {
      const content = fs.readFileSync(secretsPath, 'utf8')
      const parsed = JSON.parse(content)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {}
      }
      return parsed
    } catch {
      return {}
    }
  }

  const writeSecrets = (secrets) => {
    if (!fs || !path) {
      return
    }
    try {
      fs.mkdirSync(path.dirname(secretsPath), { recursive: true })
      fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2) + '\\n', 'utf8')
    } catch {
      // ignore secrets write errors
    }
  }

  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

  const getKeyFromArgs = (args) => {
    if (!args || args.length === 0) {
      return ''
    }
    const first = args[0]
    const second = args.length > 1 ? args[1] : undefined
    if (first && typeof first === 'object' && 'key' in first && first.key !== undefined) {
      return String(first.key)
    }
    if (typeof first === 'string' && args.length > 1) {
      return first
    }
    if (second && typeof second === 'object' && 'key' in second && second.key !== undefined) {
      return String(second.key)
    }
    return ''
  }

  const ensureSecretEntryForKey = (key, source) => {
    if (!key) {
      return
    }
    const secrets = readSecrets()
    if (hasOwn(secrets, key)) {
      log('[secrets-mock] secrets.json already has key=' + key + ' for source=' + source)
      return
    }
    secrets[key] = '[safeStorage-' + source + '-placeholder]'
    writeSecrets(secrets)
    log('[secrets-mock] wrote new secrets.json key=' + key + ' from source=' + source)
  }

  const ensureSecretEntryForEncounteredValue = (value, source) => {
    const normalizedValue = String(value)
    if (!normalizedValue) {
      return
    }
    const secrets = readSecrets()
    const values = Object.values(secrets)
    if (values.includes(normalizedValue)) {
      log('[secrets-mock] secrets.json already has value from source=' + source)
      return
    }
    const key = Buffer.from(normalizedValue, 'utf8').toString('hex').slice(0, 32)
    if (hasOwn(secrets, key)) {
      log('[secrets-mock] secrets.json already has key=' + key + ' for source=' + source)
      return
    }
    secrets[key] = normalizedValue
    writeSecrets(secrets)
    log('[secrets-mock] wrote encountered value to secrets.json key=' + key + ' source=' + source)
  }

  initializeSecretsFile()
  initializeLogFile()

  log('[secrets-mock] using global electron=' + Boolean(globalThis._____electron || globalThis.__electron))
  log('[secrets-mock] using global require=' + Boolean(globalThis._____require || globalThis.___require))

  log('[secrets-mock] secretStorage mocking disabled; using safeStorage only')

  if (electron.safeStorage) {
    log('[secrets-mock] mocked electron safeStorage')
    const safeStorage = electron.safeStorage
    if (typeof safeStorage.getItem === 'function') {
      const originalGetItem = safeStorage.getItem.bind(safeStorage)
      safeStorage.getItem = async (key, ...args) => {
        const normalizedKey = String(key)
        log('[secrets-mock] got electron safeStorage getItem event for requested key=' + normalizedKey)
        return originalGetItem(key, ...args)
      }
    }
    if (typeof safeStorage.isEncryptionAvailable === 'function') {
      safeStorage.isEncryptionAvailable = () => {
        log('[secrets-mock] got electron safeStorage isEncryptionAvailable event, returning true')
        return true
      }
    }
    if (typeof safeStorage.encryptString === 'function') {
      safeStorage.encryptString = (plaintext) => {
        const normalizedPlaintext = String(plaintext)
        const ciphertext = Buffer.from(normalizedPlaintext, 'utf8')
        ensureSecretEntryForEncounteredValue(normalizedPlaintext, 'encryptString')
        log('[secrets-mock] safeStorage encryptedStringBase64=' + ciphertext.toString('base64'))
        return ciphertext
      }
    }
    if (typeof safeStorage.decryptString === 'function') {
      safeStorage.decryptString = (ciphertext) => {
        const normalizedCiphertext = Buffer.from(ciphertext)
        const decryptedText = normalizedCiphertext.toString('utf8')
        ensureSecretEntryForEncounteredValue(decryptedText, 'decryptString')
        log('[secrets-mock] safeStorage decryptedData=' + decryptedText)
        return decryptedText
      }
    }

    if (typeof safeStorage.encryptData === 'function') {
      const originalEncryptData = safeStorage.encryptData.bind(safeStorage)
      safeStorage.encryptData = (...args) => {
        const key = getKeyFromArgs(args)
        if (key) {
          ensureSecretEntryForKey(key, 'encryptData')
        }
        return originalEncryptData(...args)
      }
    }

    if (typeof safeStorage.decryptData === 'function') {
      const originalDecryptData = safeStorage.decryptData.bind(safeStorage)
      safeStorage.decryptData = (...args) => {
        const key = getKeyFromArgs(args)
        if (key) {
          ensureSecretEntryForKey(key, 'decryptData')
        }
        return originalDecryptData(...args)
      }
    }

    if (typeof safeStorage.encryptString === 'function' && typeof safeStorage.decryptString === 'function') {
      try {
        const selfTestPlaintext = 'secrets-mock-self-test'
        const selfTestCiphertext = safeStorage.encryptString(selfTestPlaintext)
        const selfTestDecrypted = safeStorage.decryptString(selfTestCiphertext)
        log('[secrets-mock] safeStorage self-test success=' + (selfTestDecrypted === selfTestPlaintext))
      } catch (error) {
        const errorMessage = error && error.message ? error.message : String(error)
        log('[secrets-mock] safeStorage self-test failed=' + errorMessage)
      }
    }
  } else {
    log('[secrets-mock] electron.safeStorage not found')
  }
}
`
