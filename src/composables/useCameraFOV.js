import { globalSettings } from '@/states/global-settings-state.js'
import { cameraSettings } from '@/states/camera-settings-state.js'
import { watch } from 'vue'

export const useCameraFOV = () => {
  watch([() => cameraSettings.fov], () => {
    updateCameraFOV()
  })

  function updateCameraFOV() {
    if (!globalSettings.camera) return
    globalSettings.camera.fov = cameraSettings.fov
    globalSettings.camera.updateProjectionMatrix()
  }
}
