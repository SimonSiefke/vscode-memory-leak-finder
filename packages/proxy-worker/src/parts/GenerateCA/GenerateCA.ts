import forge from 'node-forge'
import type { CertificatePair } from '../CertificatePair/CertificatePair.ts'

export const generateCA = (): CertificatePair => {
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10)

  const attrs = [
    { name: 'countryName', value: 'US' },
    { name: 'organizationName', value: 'VS Code Memory Leak Finder Proxy' },
    { name: 'commonName', value: 'VS Code Proxy CA' },
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.setExtensions([
    {
      cA: true,
      name: 'basicConstraints',
    },
    {
      dataEncipherment: true,
      digitalSignature: true,
      keyCertSign: true,
      keyEncipherment: true,
      name: 'keyUsage',
      nonRepudiation: true,
    },
  ])

  cert.sign(keys.privateKey, forge.md.sha256.create())

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  }
}
