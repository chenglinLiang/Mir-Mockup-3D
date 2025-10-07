import { lightingSettings } from '@/states/lighting-settings-state.js'
import * as THREE from 'three'
import { hexToThreeColor } from '@/helpers/colors-helper.js'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useLightingSpot = () => {
  let spotLight

  const init = () => {
    if (lightingSettings.spotEnabled) {
      spotLight = new THREE.SpotLight(
        hexToThreeColor(lightingSettings.spotColor),
        lightingSettings.spotIntensity,
        lightingSettings.spotDistance,
        THREE.MathUtils.degToRad(lightingSettings.spotAngle),
        lightingSettings.spotPenumbra,
      )
      spotLight.position.set(
        lightingSettings.spotPosition.x,
        lightingSettings.spotPosition.y,
        lightingSettings.spotPosition.z,
      )
      spotLight.target.position.set(
        lightingSettings.spotTarget.x,
        lightingSettings.spotTarget.y,
        lightingSettings.spotTarget.z,
      )
      globalSettings.scene.add(spotLight)
      globalSettings.scene.add(spotLight.target)
    }
  }

  watch(
    [
      () => lightingSettings.spotEnabled,
      () => lightingSettings.spotColor,
      () => lightingSettings.spotIntensity,
      () => lightingSettings.spotAngle,
      () => lightingSettings.spotDistance,
      () => lightingSettings.spotPenumbra,
      () => lightingSettings.spotPosition,
      () => lightingSettings.spotTarget,
    ],
    () => {
      updateSpotLight()
    },
    { deep: true },
  )

  function updateSpotLight() {
    if (!globalSettings.scene) return

    if (lightingSettings.spotEnabled) {
      if (!spotLight) {
        spotLight = new THREE.SpotLight()
        globalSettings.scene.add(spotLight)
        globalSettings.scene.add(spotLight.target)
      }
      spotLight.color = hexToThreeColor(lightingSettings.spotColor)
      spotLight.intensity = lightingSettings.spotIntensity
      spotLight.distance = lightingSettings.spotDistance
      spotLight.angle = THREE.MathUtils.degToRad(lightingSettings.spotAngle)
      spotLight.penumbra = lightingSettings.spotPenumbra
      spotLight.position.set(
        lightingSettings.spotPosition.x,
        lightingSettings.spotPosition.y,
        lightingSettings.spotPosition.z,
      )
      spotLight.target.position.set(
        lightingSettings.spotTarget.x,
        lightingSettings.spotTarget.y,
        lightingSettings.spotTarget.z,
      )
      spotLight.visible = true
    } else if (spotLight) {
      spotLight.visible = false
    }
  }

  return {
    init,
  }
}
