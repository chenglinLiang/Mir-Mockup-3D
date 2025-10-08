import * as THREE from 'three'
import { globalSettings } from '@/states/global-settings-state.js'
import { backgroundSettings } from '@/states/background-settings-state.js'
import { watch } from 'vue'

export const useBackground = () => {
  const init = () => {
    updateBackground()
  }

  watch(
    [
      () => backgroundSettings.exposureCompensation,
      () => backgroundSettings.backgroundBrightness,
      () => backgroundSettings.backgroundImage,
      () => backgroundSettings.color1,
      () => backgroundSettings.color2,
    ],
    () => {
      updateBackground()
    },
  )

  function updateBackground() {
    if (!globalSettings.renderer || !globalSettings.scene) return

    globalSettings.renderer.toneMappingExposure = backgroundSettings.exposureCompensation

    if (backgroundSettings.backgroundImage) {
      const loader = new THREE.TextureLoader()
      loader.load(backgroundSettings.backgroundImage, (texture) => {
        globalSettings.scene.background = texture
      })
    } else {
      // Recréer le dégradé avec la luminosité ajustée
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const context = canvas.getContext('2d')

      // Créer le dégradé linéaire (du haut vers le bas)
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height)

      // Appliquer la luminosité aux couleurs du dégradé
      const brightness = backgroundSettings.backgroundBrightness

      const topString = backgroundSettings.color1
      const bottomString = backgroundSettings.color2

      // Extraire les valeurs HSL des chaînes de caractères
      const topMatch = topString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      const bottomMatch = bottomString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)

      if (!topMatch || !bottomMatch) {
        console.error('Invalid HSL color format')
        return
      }

      const topH = parseInt(topMatch[1])
      const topS = parseInt(topMatch[2])
      const topL = Math.min(100, parseInt(topMatch[3]) * brightness)

      const bottomH = parseInt(bottomMatch[1])
      const bottomS = parseInt(bottomMatch[2])
      const bottomL = Math.min(100, parseInt(bottomMatch[3]) * brightness)

      // Recréer les chaînes de caractères HSL avec la luminosité ajustée
      const adjustedTopColor = `hsl(${topH}, ${topS}%, ${topL}%)`
      const adjustedBottomColor = `hsl(${bottomH}, ${bottomS}%, ${bottomL}%)`

      gradient.addColorStop(0, adjustedTopColor)
      gradient.addColorStop(1, adjustedBottomColor)

      // Remplir le canvas avec le dégradé
      context.fillStyle = gradient
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Créer une texture à partir du canvas
      const gradientTexture = new THREE.CanvasTexture(canvas)
      globalSettings.scene.background = gradientTexture
    }
  }

  return {
    init,
  }
}
