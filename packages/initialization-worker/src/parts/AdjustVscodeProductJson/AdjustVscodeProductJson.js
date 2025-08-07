export const adjustVscodeProductJson = (json) => {
  const result = { ...json }
  if (Array.isArray(result.surveys)) {
    result.surveys = []
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.nlsBaseUrl === 'string') {
    result.extensionsGallery.nlsBaseUrl = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.serviceUrl === 'string') {
    result.extensionsGallery.serviceUrl = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.cacheUrl === 'string') {
    result.extensionsGallery.cacheUrl = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.itemUrl === 'string') {
    result.extensionsGallery.itemUrl = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.publisherUrl === 'string') {
    result.extensionsGallery.publisherUrl = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.resourceUrlTemplate === 'string') {
    result.extensionsGallery.resourceUrlTemplate = ''
  }
  if (result.extensionsGallery && typeof result.extensionsGallery.controlUrl === 'string') {
    result.extensionsGallery.controlUrl = ''
  }
  return result
}
