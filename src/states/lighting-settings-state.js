import { reactive } from 'vue'

const lightingSettings = reactive({
  // Lumière ambiante
  ambientEnabled: true,
  ambientColor: '#ffffff',
  ambientIntensity: 0.25,

  // Lumière directionnelle
  directionalEnabled: true,
  directionalColor: '#ffffff',
  directionalIntensity: 5,
  directionalPosition: { x: -2.2, y: -0.1, z: -1.2 },

  // Lumière ponctuelle
  pointEnabled: false,
  pointColor: '#ffffff',
  pointIntensity: 1.0,
  pointPosition: { x: 1, y: 1, z: 1 },
  pointDistance: 10,

  // Lumière spot
  spotEnabled: false,
  spotColor: '#ffffff',
  spotIntensity: 1.0,
  spotPosition: { x: -1, y: 2, z: 1 },
  spotTarget: { x: 0, y: 0, z: 0 },
  spotAngle: 30,
  spotPenumbra: 0.1,
  spotDistance: 20,

  // Éclairage global
  exposureCompensation: 1.0,
  backgroundBrightness: 1.0,
})

function resetLighting() {
  lightingSettings.ambientEnabled = true
  lightingSettings.ambientColor = '#ffffff'
  lightingSettings.ambientIntensity = 0.25

  lightingSettings.directionalEnabled = true
  lightingSettings.directionalColor = '#ffffff'
  lightingSettings.directionalIntensity = 1.2
  lightingSettings.directionalPosition.x = 2
  lightingSettings.directionalPosition.y = 3
  lightingSettings.directionalPosition.z = 1

  lightingSettings.pointEnabled = false
  lightingSettings.spotEnabled = false

  lightingSettings.exposureCompensation = 1.0
  lightingSettings.backgroundBrightness = 1.0
}

export { lightingSettings, resetLighting }
