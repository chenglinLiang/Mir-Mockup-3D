import { globalSettings } from '@/states/global-settings-state.js'
import { cameraSettings } from '@/states/camera-settings-state.js'
import { watch } from 'vue'

export const useCameraControls = () => {
  watch(
    [
      () => cameraSettings.autoRotate,
      () => cameraSettings.autoRotateSpeed,
      () => cameraSettings.minDistance,
      () => cameraSettings.maxDistance,
      () => cameraSettings.enableZoom,
      () => cameraSettings.enablePan,
      () => cameraSettings.enableRotate,
    ],
    () => {
      updateControlsSettings()
    },
  )

  function updateControlsSettings() {
    if (!globalSettings.controls) return
    globalSettings.controls.autoRotate = cameraSettings.autoRotate
    globalSettings.controls.autoRotateSpeed = cameraSettings.autoRotateSpeed
    globalSettings.controls.enableZoom = cameraSettings.enableZoom
    globalSettings.controls.enablePan = cameraSettings.enablePan
    globalSettings.controls.enableRotate = cameraSettings.enableRotate
    globalSettings.controls.minDistance = cameraSettings.minDistance
    globalSettings.controls.maxDistance = cameraSettings.maxDistance
    globalSettings.controls.minPolarAngle = cameraSettings.minPolarAngle
    globalSettings.controls.maxPolarAngle = cameraSettings.maxPolarAngle
  }
}
