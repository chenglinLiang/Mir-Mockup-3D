import { cropSettings } from '@/states/crop-settings-state.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useCropDimensions = () => {
  watch([() => cropSettings.width, () => cropSettings.height], () => {
    updateCropDimensions()
  })

  function updateCropDimensions() {
    if (!cropSettings.customAspectRatio) {
      // Maintain aspect ratio
      const ratios = {
        '16:9': 16 / 9,
        '1:1': 1,
        '4:5': 4 / 5,
        '9:16': 9 / 16,
      }

      const ratio = ratios[cropSettings.aspectRatio]
      if (ratio) {
        cropSettings.height = Math.round(cropSettings.width / ratio)
      }
    }

    // Ensure crop stays within canvas bounds
    if (globalSettings.renderer && globalSettings.container.value) {
      const canvasWidth = globalSettings.container.value.clientWidth
      const canvasHeight = globalSettings.container.value.clientHeight

      cropSettings.width = Math.min(cropSettings.width, canvasWidth)
      cropSettings.height = Math.min(cropSettings.height, canvasHeight)
      cropSettings.x = Math.min(cropSettings.x, canvasWidth - cropSettings.width)
      cropSettings.y = Math.min(cropSettings.y, canvasHeight - cropSettings.height)
    }
  }
}
