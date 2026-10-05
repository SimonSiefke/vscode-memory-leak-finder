import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const getColorPicker = (page: any) => {
  return page.locator('.standalone-colorpicker-body')
}

const getColorValue = (page: any) => {
  return getColorPicker(page).locator('.picked-color-presentation')
}

const getSaturationArea = (page: any) => {
  return getColorPicker(page).locator('.saturation-wrap')
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const dispatchPointerUp = async (x: number, y: number) => {
    await page.evaluate({
      expression: `(() => {
        const saturationArea = document.querySelector('.standalone-colorpicker-body .saturation-wrap')
        if (!saturationArea) {
          throw new Error('Color picker saturation area not found')
        }
        saturationArea.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          buttons: 0,
          clientX: ${JSON.stringify(x)},
          clientY: ${JSON.stringify(y)},
          pointerId: 1,
          pointerType: 'mouse',
        }))
      })()`,
    })
  }

  const getSaturationAreaBox = async () => {
    const saturationArea = getSaturationArea(page)
    await expect(saturationArea).toBeVisible()
    const box = await saturationArea.boundingBox()
    if (!box) {
      throw new Error(`Failed to get saturation area bounds`)
    }
    return box
  }

  const dragColorAreaPointer = async ({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
    await page.mouse.mockPointerEvents()
    const areaBox = await getSaturationAreaBox()
    const startX = clamp(from.x, areaBox.x, areaBox.x + areaBox.width)
    const startY = clamp(from.y, areaBox.y, areaBox.y + areaBox.height)
    const targetX = clamp(to.x, areaBox.x, areaBox.x + areaBox.width)
    const targetY = clamp(to.y, areaBox.y, areaBox.y + areaBox.height)

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(targetX, targetY)
    await dispatchPointerUp(targetX, targetY)
    await page.mouse.up()
    await page.waitForIdle()
  }

  const waitForColorValue = async (expected: string) => {
    for (let i = 0; i < 10; i++) {
      const actual = await api.getColorValue()
      if (actual === expected) {
        return
      }
      await page.waitForIdle()
    }
    throw new Error(`Expected color picker color value to be "${expected}"`)
  }

  const waitForColorValueToChange = async (previous: string): Promise<string> => {
    for (let i = 0; i < 10; i++) {
      const actual = await api.getColorValue()
      if (actual !== previous) {
        return actual
      }
      await page.waitForIdle()
    }
    throw new Error(`Expected color picker color value to change from "${previous}"`)
  }

  const api = {
    async close() {
      try {
        await page.waitForIdle()
        const colorPicker = getColorPicker(page)
        await expect(colorPicker).toBeVisible()
        const closeButton = colorPicker.locator('.button.close-icon')
        await expect(closeButton).toBeVisible()
        await closeButton.click()
        await expect(colorPicker).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close color picker`)
      }
    },
    async dragColorAreaPointerRight() {
      try {
        await page.waitForIdle()
        const areaBox = await getSaturationAreaBox()
        const start = {
          x: areaBox.x + areaBox.width * 0.2,
          y: areaBox.y + areaBox.height * 0.5,
        }
        const distance = Math.max(24, areaBox.width * 0.15)
        const end = {
          x: start.x + distance,
          y: start.y,
        }
        await dragColorAreaPointer({ from: start, to: end })
      } catch (error) {
        throw new VError(error, `Failed to drag color picker color area pointer right`)
      }
    },
    async dragColorAreaPointerTo(position: { x: number; y: number }) {
      try {
        await page.waitForIdle()
        await dragColorAreaPointer({ from: position, to: position })
      } catch (error) {
        throw new VError(error, `Failed to drag color picker color area pointer to position`)
      }
    },
    async getColorValue() {
      try {
        await page.waitForIdle()
        const colorValue = getColorValue(page)
        await expect(colorValue).toBeVisible()
        return (await colorValue.textContent()) ?? ''
      } catch (error) {
        throw new VError(error, `Failed to get color picker color value`)
      }
    },
    async open() {
      try {
        await page.waitForIdle()
        const colorPicker = getColorPicker(page)
        await expect(colorPicker).toBeHidden()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ShowOrFocusStandaloneColorPicker, { pressKeyOnce: true })
        await page.waitForIdle()
        await expect(colorPicker).toBeVisible()
        const insertButton = colorPicker.locator('.insert-button')
        await expect(insertButton).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open color picker`)
      }
    },
    async shouldChangeColorValueWhenDraggingColorAreaPointerRight() {
      try {
        const areaBox = await getSaturationAreaBox()
        const start = {
          x: areaBox.x + areaBox.width * 0.2,
          y: areaBox.y + areaBox.height * 0.5,
        }
        const end = {
          x: areaBox.x + areaBox.width * 0.8,
          y: start.y,
        }
        await dragColorAreaPointer({ from: start, to: start })
        const before = await api.getColorValue()
        await dragColorAreaPointer({ from: start, to: end })
        await waitForColorValueToChange(before)
        await dragColorAreaPointer({ from: end, to: start })
        await waitForColorValue(before)
      } catch (error) {
        throw new VError(error, `Failed to verify color picker color value changed`)
      }
    },
  }
  return api
}
