import { cameraSettings } from '@/states/camera-settings-state.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useCameraPosition = () => {
  watch(
    [() => cameraSettings.position, () => cameraSettings.target],
    () => {
      updateCameraPosition()
    },
    { deep: true },
  )

  function updateCameraPosition() {
    if (!globalSettings.camera || !globalSettings.controls) return
    globalSettings.camera.position.set(
      cameraSettings.position.x,
      cameraSettings.position.y,
      cameraSettings.position.z,
    )
    globalSettings.controls.target.set(
      cameraSettings.target.x,
      cameraSettings.target.y,
      cameraSettings.target.z,
    )
    globalSettings.controls.update()
  }
}
