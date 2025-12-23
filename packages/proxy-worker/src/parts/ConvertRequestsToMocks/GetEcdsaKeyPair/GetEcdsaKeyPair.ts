import { generateKeyPairSync } from 'crypto'

// Cache for ECDSA key pairs (one per curve)
const ecdsaKeyPairs = new Map<string, { privateKey: string; publicKey: string }>()

export const getEcdsaKeyPair = (algorithm: string): { privateKey: string; publicKey: string } => {
  // Map algorithm to curve name
  let curve: string
  switch (algorithm) {
    case 'ES256': {
      curve = 'prime256v1' // P-256

      break
    }
    case 'ES384': {
      curve = 'secp384r1' // P-384

      break
    }
    case 'ES512': {
      curve = 'secp521r1' // P-521

      break
    }
    default: {
      curve = 'prime256v1' // Default to P-256
    }
  }

  if (!ecdsaKeyPairs.has(curve)) {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: curve,
    })
    ecdsaKeyPairs.set(curve, {
      privateKey: privateKey.export({ format: 'pem', type: 'sec1' }),
      publicKey: publicKey.export({ format: 'pem', type: 'spki' }),
    })
  }

  return ecdsaKeyPairs.get(curve)!
}
