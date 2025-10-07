import { lightingSettings } from '@/states/lighting-settings-state.js'
import * as THREE from 'three'
import { globalSettings } from '@/states/global-settings-state.js'
import { watch } from 'vue'

export const useLightingGlobal = () => {
  const init = () => {
    updateGlobalLighting()
  }

  watch(
    [() => lightingSettings.exposureCompensation, () => lightingSettings.backgroundBrightness],
    () => {
      updateGlobalLighting()
    },
  )

  function updateGlobalLighting() {
    if (!globalSettings.renderer || !globalSettings.scene) return

    globalSettings.renderer.toneMappingExposure = lightingSettings.exposureCompensation

    // Recréer le dégradé avec la luminosité ajustée
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const context = canvas.getContext('2d')

    // Créer le dégradé linéaire (du haut vers le bas)
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)

    // Appliquer la luminosité aux couleurs du dégradé
    const brightness = lightingSettings.backgroundBrightness
    const topColor = `hsl(194, 70%, ${Math.min(100, 72 * brightness)}%)` // Bleu ciel ajusté
    const bottomColor = `hsl(60, 77%, ${Math.min(100, 96 * brightness)}%)` // Crème ajusté

    gradient.addColorStop(0, topColor)
    gradient.addColorStop(1, bottomColor)

    // Remplir le canvas avec le dégradé
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Créer une texture à partir du canvas
    const gradientTexture = new THREE.CanvasTexture(canvas)
    globalSettings.scene.background = gradientTexture
  }

  return {
    init,
  }
}
