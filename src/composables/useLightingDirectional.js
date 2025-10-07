import { lightingSettings } from '@/states/lighting-settings-state.js'
import * as THREE from 'three'
import { hexToThreeColor } from '@/helpers/colors-helper.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useLightingDirectional = () => {
  let directionalLight

  const init = () => {
    if (lightingSettings.directionalEnabled) {
      directionalLight = new THREE.DirectionalLight(
        hexToThreeColor(lightingSettings.directionalColor),
        lightingSettings.directionalIntensity,
      )
      directionalLight.position.set(
        lightingSettings.directionalPosition.x,
        lightingSettings.directionalPosition.y,
        lightingSettings.directionalPosition.z,
      )
      directionalLight.castShadow = false
      globalSettings.scene.add(directionalLight)
    }
  }

  watch(
    [
      () => lightingSettings.directionalEnabled,
      () => lightingSettings.directionalColor,
      () => lightingSettings.directionalIntensity,
      () => lightingSettings.directionalPosition,
    ],
    () => {
      updateDirectionalLight()
    },
    { deep: true },
  )

  function updateDirectionalLight() {
    if (!globalSettings.scene) return

    if (lightingSettings.directionalEnabled) {
      if (!directionalLight) {
        directionalLight = new THREE.DirectionalLight()
        globalSettings.scene.add(directionalLight)
      }
      directionalLight.color = hexToThreeColor(lightingSettings.directionalColor)
      directionalLight.intensity = lightingSettings.directionalIntensity
      directionalLight.position.set(
        lightingSettings.directionalPosition.x,
        lightingSettings.directionalPosition.y,
        lightingSettings.directionalPosition.z,
      )
      directionalLight.visible = true
    } else if (directionalLight) {
      directionalLight.visible = false
    }
  }

  return {
    init,
  }
}
