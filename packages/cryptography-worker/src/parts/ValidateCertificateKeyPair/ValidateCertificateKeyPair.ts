import forge from 'node-forge'

export const validateCertificateKeyPair = (cert: string, key: string): boolean => {
  try {
    const certificate = forge.pki.certificateFromPem(cert)
    const privateKey = forge.pki.privateKeyFromPem(key)

    // Get the public key from the certificate
    const certPublicKey = certificate.publicKey

    // For RSA keys, compare the modulus (n) and public exponent (e)
    // The certificate's public key should match the public key derived from the private key
    if ((certPublicKey as any).n && (certPublicKey as any).e && (privateKey as any).n && (privateKey as any).e) {
      return (certPublicKey as any).n.equals((privateKey as any).n) && (certPublicKey as any).e.equals((privateKey as any).e)
    }

    return false
  } catch {
    return false
  }
}
