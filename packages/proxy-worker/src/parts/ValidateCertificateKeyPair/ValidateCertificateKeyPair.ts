import forge from 'node-forge'

export const validateCertificateKeyPair = (cert: string, key: string): boolean => {
  try {
    const certificate = forge.pki.certificateFromPem(cert)
    const privateKey = forge.pki.privateKeyFromPem(key)

    // Get the public key from the certificate
    const certPublicKey = certificate.publicKey

    // For RSA keys, compare the modulus (n) and public exponent (e)
    // The certificate's public key should match the public key derived from the private key
    if (certPublicKey.n && certPublicKey.e && privateKey.n && privateKey.e) {
      return certPublicKey.n.equals(privateKey.n) && certPublicKey.e.equals(privateKey.e)
    }

    return false
  } catch (error) {
    return false
  }
}
