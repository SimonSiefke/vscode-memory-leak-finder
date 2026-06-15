const form = document.getElementById('upload-form')
const tokenInput = document.getElementById('upload-token')
const fileInput = document.getElementById('zip-file')
const result = document.getElementById('result')

if (!(form instanceof HTMLFormElement)) {
  throw new Error('Upload form element not found')
}

if (!(tokenInput instanceof HTMLInputElement)) {
  throw new Error('Upload token input element not found')
}

if (!(fileInput instanceof HTMLInputElement)) {
  throw new Error('Upload file input element not found')
}

if (!(result instanceof HTMLElement)) {
  throw new Error('Upload result element not found')
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const token = tokenInput.value.trim()
  const file = fileInput.files && fileInput.files[0]
  if (!token) {
    result.textContent = 'An upload token is required.'
    return
  }
  if (!file) {
    result.textContent = 'Please choose a zip file first.'
    return
  }
  result.textContent = 'Uploading...'
  try {
    const response = await fetch('/api/user-data/upload', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': file.type || 'application/zip',
      },
      body: file,
    })
    const text = await response.text()
    let parsed = text
    try {
      parsed = JSON.stringify(JSON.parse(text), null, 2)
    } catch {}
    if (!response.ok) {
      result.textContent = 'Upload failed:\n' + parsed
      return
    }
    result.textContent = 'Snapshot uploaded successfully. Future measure workflows will use this uploaded user data snapshot.'
  } catch (error) {
    result.textContent = error instanceof Error ? error.message : String(error)
  }
})
