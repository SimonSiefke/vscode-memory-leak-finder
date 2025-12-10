import { request } from 'http'

const options = {
  hostname: '127.0.0.1',
  port: 34355,
  method: 'GET',
  path: 'https://github.gallerycdn.vsassets.io/extensions/github/copilot/1.388.0/1761326434179/Microsoft.VisualStudio.Services.VSIXPackage',
  headers: {
    Host: 'github.gallerycdn.vsassets.io',
  },
}

const req = request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers:`, res.headers)
  res.pipe(process.stdout)
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
