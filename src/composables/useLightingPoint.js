import { lightingSettings } from '@/states/lighting-settings-state.js'
import * as THREE from 'three'
import { hexToThreeColor } from '@/helpers/colors-helper.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useLightingPoint = () => {
  let pointLight

  const init = () => {
    if (lightingSettings.pointEnabled) {
      pointLight = new THREE.PointLight(
        hexToThreeColor(lightingSettings.pointColor),
        lightingSettings.pointIntensity,
        lightingSettings.pointDistance,
      )
      pointLight.position.set(
        lightingSettings.pointPosition.x,
        lightingSettings.pointPosition.y,
        lightingSettings.pointPosition.z,
      )
      globalSettings.scene.add(pointLight)
    }
  }

  watch(
    [
      () => lightingSettings.pointEnabled,
      () => lightingSettings.pointColor,
      () => lightingSettings.pointIntensity,
      () => lightingSettings.pointDistance,
      () => lightingSettings.pointPosition,
    ],
    () => {
      updatePointLight()
    },
    { deep: true },
  )

  function updatePointLight() {
    if (!globalSettings.scene) return

    if (lightingSettings.pointEnabled) {
      if (!pointLight) {
        pointLight = new THREE.PointLight()
        globalSettings.scene.add(pointLight)
      }
      pointLight.color = hexToThreeColor(lightingSettings.pointColor)
      pointLight.intensity = lightingSettings.pointIntensity
      pointLight.distance = lightingSettings.pointDistance
      pointLight.position.set(
        lightingSettings.pointPosition.x,
        lightingSettings.pointPosition.y,
        lightingSettings.pointPosition.z,
      )
      pointLight.visible = true
    } else if (pointLight) {
      pointLight.visible = false
    }
  }

  return {
    init,
  }
}
