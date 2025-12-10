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
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
  ])

  cert.sign(keys.privateKey, forge.md.sha256.create())

  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert),
  }
}

