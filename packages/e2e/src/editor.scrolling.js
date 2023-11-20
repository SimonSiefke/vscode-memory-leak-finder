export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'file.txt'), generateFileContent())
}

export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ page, expect }) => {
  const editor = page.locator('.editor-instance')
  await expect(editor).toBeVisible()
  const scrollbar = editor.locator('.scrollbar.vertical').first()
  await scrollbar.hover()
  const scrollbarSlider = scrollbar.locator('.slider')

  const elementBox1 = await scrollbarSlider.boundingBox()
  if (!elementBox1) {
    throw new Error('Unable to find bounding box on element')
  }

  const elementCenterX = elementBox1.x + elementBox1.width / 2
  const elementCenterY = elementBox1.y + elementBox1.height / 2

  const xOffset = 0
  const yOffset = 200

  await scrollbarSlider.hover()
  await page.mouse.down()
  await page.mouse.move(elementCenterX + xOffset, elementCenterY + yOffset)
  await page.mouse.up()

  const elementBox2 = await scrollbarSlider.boundingBox()
  if (!elementBox2) {
    throw new Error('Unable to find bounding box on element')
  }

  const elementCenterX2 = elementBox1.x + elementBox1.width / 2
  const elementCenterY2 = elementBox1.y + elementBox1.height / 2

  await page.mouse.down()
  await page.mouse.move(elementCenterX2 + xOffset, elementCenterY2 - yOffset)
  await page.mouse.up()
}
