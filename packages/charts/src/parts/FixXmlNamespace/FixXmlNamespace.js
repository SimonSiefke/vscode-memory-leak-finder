export const fixHtmlNamespace = (html) => {
  return html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ')
}
