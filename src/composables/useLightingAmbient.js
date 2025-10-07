import { lightingSettings } from '@/states/lighting-settings-state.js'
import * as THREE from 'three'
import { hexToThreeColor } from '@/helpers/colors-helper.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useLightingAmbient = () => {
  let ambientLight

  const init = () => {
    if (lightingSettings.ambientEnabled) {
      ambientLight = new THREE.AmbientLight(
        hexToThreeColor(lightingSettings.ambientColor),
        lightingSettings.ambientIntensity,
      )
      globalSettings.scene.add(ambientLight)
    }
  }

  watch(
    [
      () => lightingSettings.ambientEnabled,
      () => lightingSettings.ambientColor,
      () => lightingSettings.ambientIntensity,
    ],
    () => {
      updateAmbientLight()
    },
  )

  function updateAmbientLight() {
    console.log('Mise à jour de la lumière ambiante')
    if (!globalSettings.scene) return

    if (lightingSettings.ambientEnabled) {
      if (!ambientLight) {
        ambientLight = new THREE.AmbientLight()
        globalSettings.scene.add(ambientLight)
      }
      ambientLight.color = hexToThreeColor(lightingSettings.ambientColor)
      ambientLight.intensity = lightingSettings.ambientIntensity
      ambientLight.visible = true
    } else if (ambientLight) {
      ambientLight.visible = false
    }
  }

  return {
    init,
  }
}
