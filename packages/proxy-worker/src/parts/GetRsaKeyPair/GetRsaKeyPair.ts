import { generateKeyPairSync } from 'node:crypto'

// Cache for RSA key pair (one is enough for mock tokens)
let rsaKeyPair: { privateKey: string; publicKey: string } | null = null

export const getRsaKeyPair = (): { privateKey: string; publicKey: string } => {
  if (!rsaKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })
    rsaKeyPair = {
      privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }),
      publicKey: publicKey.export({ format: 'pem', type: 'spki' }),
    }
  }
  return rsaKeyPair
}
